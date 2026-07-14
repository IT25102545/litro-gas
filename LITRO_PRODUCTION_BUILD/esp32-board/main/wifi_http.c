/**
 * wifi_http.c — Litro Gas WiFi + HTTP Connection Layer
 * Added to connect the Gas Cylinder Counter board to the Litro Gas server.
 * NO changes to existing board code files (sensors.c / state_machine.c / sensors.h / state_machine.h).
 *
 * Includes:
 *  1. WiFi station mode connection
 *  2. HTTP POST on every cylinder count  (/api/sensor/count)
 *  3. HTTP POST on last-cylinder sensor  (/api/sensor/complete)
 *  4. HTTP GET polling for gate commands (/api/gate/command)
 *     When server says "open", injects EVENT_BUTTON_HIGH into the state machine queue
 *     → board opens gate relay + resets count → ready for next lorry.
 */

#include "wifi_http.h"
#include "sensors.h"    // for EVENT_BUTTON_HIGH, sensor_event_t — read-only use

#include <string.h>
#include <stdio.h>

#include "esp_log.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "freertos/queue.h"
#include "esp_http_client.h"
#include "nvs_flash.h"

static const char *TAG = "WIFI_HTTP";

#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAIL_BIT      BIT1
#define WIFI_MAX_RETRIES   5

static EventGroupHandle_t s_wifi_event_group;
static int s_retry_num = 0;
static bool s_wifi_connected = false;

// ─── WiFi Event Handler ──────────────────────────────────────────────────────

static void wifi_event_handler(void *arg, esp_event_base_t event_base,
                               int32_t event_id, void *event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        s_wifi_connected = false;
        if (s_retry_num < WIFI_MAX_RETRIES) {
            esp_wifi_connect();
            s_retry_num++;
            ESP_LOGW(TAG, "Retrying WiFi (%d/%d)...", s_retry_num, WIFI_MAX_RETRIES);
        } else {
            xEventGroupSetBits(s_wifi_event_group, WIFI_FAIL_BIT);
        }
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        ESP_LOGI(TAG, "WiFi connected — IP: " IPSTR, IP2STR(&event->ip_info.ip));
        s_retry_num = 0;
        s_wifi_connected = true;
        xEventGroupSetBits(s_wifi_event_group, WIFI_CONNECTED_BIT);
    }
}

// ─── Public: wifi_init ───────────────────────────────────────────────────────

void wifi_init(void)
{
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    s_wifi_event_group = xEventGroupCreate();
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    ESP_ERROR_CHECK(esp_event_handler_instance_register(
        WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL, &instance_any_id));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(
        IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL, &instance_got_ip));

    wifi_config_t wifi_config = {
        .sta = {
            .ssid     = WIFI_SSID,
            .password = WIFI_PASSWORD,
            .threshold.authmode = WIFI_AUTH_WPA2_PSK,
        },
    };
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "Connecting to WiFi: %s ...", WIFI_SSID);
    EventBits_t bits = xEventGroupWaitBits(s_wifi_event_group,
        WIFI_CONNECTED_BIT | WIFI_FAIL_BIT, pdFALSE, pdFALSE, portMAX_DELAY);

    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGI(TAG, "WiFi ready!");
    } else {
        ESP_LOGE(TAG, "WiFi failed. HTTP reporting disabled.");
    }
}

// ─── Internal: HTTP POST helper ──────────────────────────────────────────────

static void do_http_post(const char *url, const char *json_body)
{
    if (!s_wifi_connected) return;

    esp_http_client_config_t config = {
        .url        = url,
        .method     = HTTP_METHOD_POST,
        .timeout_ms = 5000,
    };
    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_header(client, "X-API-Key", BOARD_API_KEY);
    esp_http_client_set_post_field(client, json_body, strlen(json_body));

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK) {
        ESP_LOGI(TAG, "POST %s → %d", url, esp_http_client_get_status_code(client));
    } else {
        ESP_LOGE(TAG, "POST failed: %s", esp_err_to_name(err));
    }
    esp_http_client_cleanup(client);
}

// ─── Public: http_report_count ───────────────────────────────────────────────

void http_report_count(uint32_t current_count)
{
    char url[256], body[128];
    snprintf(url,  sizeof(url),  "%s%s", SERVER_URL, ENDPOINT_COUNT);
    snprintf(body, sizeof(body), "{\"bayId\":%d,\"count\":%lu}", BAY_ID, current_count);
    ESP_LOGI(TAG, "Reporting count %lu", current_count);
    do_http_post(url, body);
}

// ─── Public: http_report_complete ────────────────────────────────────────────

void http_report_complete(uint32_t final_count)
{
    char url[256], body[128];
    snprintf(url,  sizeof(url),  "%s%s", SERVER_URL, ENDPOINT_COMPLETE);
    snprintf(body, sizeof(body), "{\"bayId\":%d,\"finalCount\":%lu}", BAY_ID, final_count);
    ESP_LOGI(TAG, "Reporting COMPLETE — finalCount=%lu", final_count);
    do_http_post(url, body);
}

// ─── Public: http_report_error ────────────────────────────────────────────────

void http_report_error(const char *error_code)
{
    char url[256], body[128];
    snprintf(url,  sizeof(url),  "%s%s", SERVER_URL, ENDPOINT_ERROR);
    snprintf(body, sizeof(body), "{\"bayId\":%d,\"errorCode\":\"%s\"}", BAY_ID, error_code);
    ESP_LOGW(TAG, "Reporting error: %s", error_code);
    do_http_post(url, body);
}

// ─── Gate Polling Task ────────────────────────────────────────────────────────
// Polls GET /api/gate/command?bayId=N every GATE_POLL_MS milliseconds.
// If the server responds with { "command": "open" }, injects EVENT_BUTTON_HIGH
// into the state machine queue — this causes the board to:
//   1. Open the gate relay (door opens for next lorry)
//   2. Reset the cylinder count to 0 (clean slate for new lorry)
// This matches EXACTLY the behaviour of pressing the physical Resume button (GPIO 14).

static QueueHandle_t s_sm_queue = NULL; // State machine event queue (from main.c)

static void gate_poll_task(void *pvParameters)
{
    char url[300];
    snprintf(url, sizeof(url), "%s%s?bayId=%d", SERVER_URL, ENDPOINT_GATE_CMD, BAY_ID);

    char response_buf[64];

    while (1) {
        vTaskDelay(pdMS_TO_TICKS(GATE_POLL_MS));

        if (!s_wifi_connected || s_sm_queue == NULL) continue;

        // Perform GET request and capture response body
        esp_http_client_config_t config = {
            .url        = url,
            .method     = HTTP_METHOD_GET,
            .timeout_ms = 4000,
        };
        esp_http_client_handle_t client = esp_http_client_init(&config);

        memset(response_buf, 0, sizeof(response_buf));

        esp_err_t err = esp_http_client_open(client, 0);
        if (err == ESP_OK) {
            int content_len = esp_http_client_fetch_headers(client);
            if (content_len >= 0 && content_len < (int)sizeof(response_buf) - 1) {
                esp_http_client_read(client, response_buf, content_len);
            } else if (content_len < 0) {
                // Chunked or unknown — read up to buffer size
                esp_http_client_read(client, response_buf, sizeof(response_buf) - 1);
            }
            esp_http_client_close(client);
        } else {
            ESP_LOGW(TAG, "Gate poll GET failed: %s", esp_err_to_name(err));
        }
        esp_http_client_cleanup(client);

        // Check if server wants gate open
        if (strstr(response_buf, "\"open\"") != NULL) {
            ESP_LOGI(TAG, "Gate command received: OPEN — injecting EVENT_BUTTON_HIGH");

            sensor_event_t evt = {
                .type      = EVENT_BUTTON_HIGH,
                .timestamp = xTaskGetTickCount(),
            };
            // Non-blocking send — if queue is full, the board will retry next poll cycle
            xQueueSend(s_sm_queue, &evt, 0);
        }
    }
}

// ─── Public: wifi_http_start_gate_polling ────────────────────────────────────

void wifi_http_start_gate_polling(QueueHandle_t sm_queue)
{
    s_sm_queue = sm_queue;
    xTaskCreate(gate_poll_task, "gate_poll_task", 4096, NULL, 4, NULL);
    ESP_LOGI(TAG, "Gate polling task started (polling every %dms)", GATE_POLL_MS);
}
