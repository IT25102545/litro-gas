/**
 * main.c — Litro Gas Integration Entry Point
 * ------------------------------------------
 * Adds WiFi, HTTP reporting, and gate polling around the UNCHANGED board logic.
 * Original files (sensors.c, state_machine.c, *.h) are NOT modified.
 */

#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_log.h"

#include "state_machine.h"  // UNCHANGED board code
#include "sensors.h"        // UNCHANGED board code
#include "wifi_http.h"      // Litro Gas addition

static const char *TAG = "MAIN";

void app_main(void)
{
    ESP_LOGI(TAG, "=== Litro Gas Cylinder Counter — Queue Mode ===");

    // 1. Connect to WiFi
    wifi_init();

    // 2. Start state machine (unchanged board logic)
    //    Pass current task handle so state machine can notify us on each count.
    QueueHandle_t sm_queue = init_state_machine(xTaskGetCurrentTaskHandle());

    if (sm_queue == NULL) {
        ESP_LOGE(TAG, "State machine init failed. Halting.");
        return;
    }

    // 3. Start sensors (unchanged board logic)
    init_sensors(sm_queue);
    ESP_LOGI(TAG, "Board initialised. Waiting for supervisor to start queue...");

    // 4. Start gate polling task
    //    This polls /api/gate/command every GATE_POLL_MS ms.
    //    When server queues the next lorry, it sends "open" — the task injects
    //    EVENT_BUTTON_HIGH into sm_queue → board opens gate relay + resets count.
    wifi_http_start_gate_polling(sm_queue);

    // 5. Main loop — react to count increments from the state machine
    uint32_t last_reported_count = 0;

    while (1) {
        // Block until state machine notifies us (or 10s timeout for heartbeat)
        uint32_t notified = ulTaskNotifyTake(pdTRUE, pdMS_TO_TICKS(10000));
        uint32_t current_count = get_cylinder_count();

        if (notified > 0 && current_count != last_reported_count) {
            last_reported_count = current_count;
            http_report_count(current_count);
        } else if (notified == 0) {
            ESP_LOGI(TAG, "Heartbeat — current count: %lu", current_count);
        }
    }
}
