#include "sensors.h"
#include "driver/gpio.h"
#include "freertos/task.h"
#include "esp_log.h"

#define DEBOUNCE_TIME_MS 50
static const char *TAG = "SENSORS";

// Global configs for tasks
static sensor_task_config_t sensor_a_config;
static sensor_task_config_t sensor_b_config;
static sensor_task_config_t sensor_last_cyl_config;
static sensor_task_config_t button_config;

static void sensor_task(void *pvParameters) {
    sensor_task_config_t *config = (sensor_task_config_t *)pvParameters;
    
    // Configure GPIO
    gpio_config_t io_conf = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_INPUT,
        .pin_bit_mask = (1ULL << config->gpio_pin),
        .pull_down_en = 1, // Assuming sensors might float low, adjust if active-low.
        .pull_up_en = 0
    };
    gpio_config(&io_conf);

    int current_state = gpio_get_level(config->gpio_pin);
    int last_stable_state = current_state;
    uint32_t debounce_timer = 0;

    ESP_LOGI(TAG, "Sensor task started on GPIO %d, initial state: %d", config->gpio_pin, current_state);

    while (1) {
        int reading = gpio_get_level(config->gpio_pin);

        if (reading != current_state) {
            debounce_timer = 0;
            current_state = reading;
        } else {
            debounce_timer += 10; // 10 ms delay loop
        }

        if (debounce_timer >= DEBOUNCE_TIME_MS) {
            if (current_state != last_stable_state) {
                last_stable_state = current_state;
                
                sensor_event_t evt = {
                    .type = (current_state == 1) ? config->high_event : config->low_event,
                    .timestamp = xTaskGetTickCount()
                };
                
                if (config->event_queue) {
                    xQueueSend(config->event_queue, &evt, portMAX_DELAY);
                }
                
                ESP_LOGI(TAG, "Sensor on GPIO %d changed to %d", config->gpio_pin, current_state);
            }
            // Prevent timer overflow by capping it once debounced
            debounce_timer = DEBOUNCE_TIME_MS;
        }

        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

static void terminal_input_task(void *pvParameters) {
    QueueHandle_t event_queue = (QueueHandle_t)pvParameters;
    int c;
    while (1) {
        c = getchar();
        if (c == 'r' || c == 'R') {
            ESP_LOGI(TAG, "Terminal input: Resume/Reset button pressed");
            sensor_event_t evt = {
                .type = EVENT_BUTTON_HIGH,
                .timestamp = xTaskGetTickCount()
            };
            if (event_queue) {
                xQueueSend(event_queue, &evt, portMAX_DELAY);
            }
        } else if (c == 'l' || c == 'L') {
            ESP_LOGI(TAG, "Terminal input: Last cylinder detected");
            sensor_event_t evt = {
                .type = EVENT_LAST_CYL_HIGH,
                .timestamp = xTaskGetTickCount()
            };
            if (event_queue) {
                xQueueSend(event_queue, &evt, portMAX_DELAY);
            }
        }
        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

void init_sensors(QueueHandle_t event_queue) {
    sensor_a_config.gpio_pin = SENSOR_A_GPIO;
    sensor_a_config.high_event = EVENT_SENSOR_A_HIGH;
    sensor_a_config.low_event = EVENT_SENSOR_A_LOW;
    sensor_a_config.event_queue = event_queue;

    sensor_b_config.gpio_pin = SENSOR_B_GPIO;
    sensor_b_config.high_event = EVENT_SENSOR_B_HIGH;
    sensor_b_config.low_event = EVENT_SENSOR_B_LOW;
    sensor_b_config.event_queue = event_queue;

    sensor_last_cyl_config.gpio_pin = SENSOR_LAST_CYL_GPIO;
    sensor_last_cyl_config.high_event = EVENT_LAST_CYL_HIGH;
    sensor_last_cyl_config.low_event = EVENT_LAST_CYL_LOW;
    sensor_last_cyl_config.event_queue = event_queue;

    button_config.gpio_pin = BUTTON_RESUME_GPIO;
    button_config.high_event = EVENT_BUTTON_HIGH;
    button_config.low_event = EVENT_BUTTON_LOW;
    button_config.event_queue = event_queue;

    xTaskCreate(sensor_task, "sensor_a_task", 2048, &sensor_a_config, 5, NULL);
    xTaskCreate(sensor_task, "sensor_b_task", 2048, &sensor_b_config, 5, NULL);
    xTaskCreate(sensor_task, "sensor_last_task", 2048, &sensor_last_cyl_config, 5, NULL);
    xTaskCreate(sensor_task, "button_task", 2048, &button_config, 5, NULL);
    xTaskCreate(terminal_input_task, "term_input_task", 2048, event_queue, 5, NULL);
}
