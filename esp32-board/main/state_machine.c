#include "state_machine.h"
#include "sensors.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "driver/gpio.h"

static const char *TAG = "STATE_MACHINE";

#define GATE_RELAY_GPIO 25

typedef enum {
    STATE_IDLE,
    
    // Forward movement states
    STATE_FWD_1, // A only
    STATE_FWD_2, // A and B
    STATE_FWD_3, // B only (leaving A)
    
    // Backward movement states
    STATE_BWD_1, // B only
    STATE_BWD_2, // B and A
    STATE_BWD_3  // A only (leaving B)
} system_state_t;

static system_state_t current_state = STATE_IDLE;
static uint32_t cylinder_count = 0;
static uint32_t error_count = 0;
static TaskHandle_t count_update_task = NULL;

static QueueHandle_t sm_event_queue = NULL;

static void process_event(sensor_event_type_t event) {
    // Handle global events independent of directional state machine
    if (event == EVENT_LAST_CYL_HIGH) {
        gpio_set_level(GATE_RELAY_GPIO, 1);
        ESP_LOGI(TAG, "Last cylinder detected. Gate CLOSED.");
        return;
    } else if (event == EVENT_BUTTON_HIGH) {
        gpio_set_level(GATE_RELAY_GPIO, 0);
        cylinder_count = 0;
        error_count = 0;
        ESP_LOGI(TAG, "Button/Terminal input received. Gate OPENED and counters reset.");
        return;
    }

    switch (current_state) {
        case STATE_IDLE:
            if (event == EVENT_SENSOR_A_HIGH) {
                current_state = STATE_FWD_1;
                ESP_LOGI(TAG, "Movement started: FORWARD (A detected)");
            } else if (event == EVENT_SENSOR_B_HIGH) {
                current_state = STATE_BWD_1;
                ESP_LOGI(TAG, "Movement started: BACKWARD (B detected)");
            }
            break;

        // --- Forward Path ---
        case STATE_FWD_1:
            if (event == EVENT_SENSOR_B_HIGH) {
                current_state = STATE_FWD_2;
                ESP_LOGI(TAG, "Cylinder at A & B (Forward)");
            } else if (event == EVENT_SENSOR_A_LOW) {
                current_state = STATE_IDLE;
                ESP_LOGI(TAG, "Wiggle: Returned to IDLE");
            }
            break;

        case STATE_FWD_2:
            if (event == EVENT_SENSOR_A_LOW) {
                current_state = STATE_FWD_3;
                ESP_LOGI(TAG, "Cylinder left A, now at B (Forward)");
            } else if (event == EVENT_SENSOR_B_LOW) {
                current_state = STATE_FWD_1;
                ESP_LOGI(TAG, "Wiggle: Returned to A only");
            }
            break;

        case STATE_FWD_3:
            if (event == EVENT_SENSOR_B_LOW) {
                cylinder_count++;
                if (count_update_task != NULL) {
                    xTaskNotifyGive(count_update_task);
                }
                current_state = STATE_IDLE;
                ESP_LOGI(TAG, "SUCCESS: Cylinder counted! Total: %lu", cylinder_count);
            } else if (event == EVENT_SENSOR_A_HIGH) {
                current_state = STATE_FWD_2;
                ESP_LOGI(TAG, "Wiggle: Returned to A & B");
            }
            break;

        // --- Backward Path ---
        case STATE_BWD_1:
            if (event == EVENT_SENSOR_A_HIGH) {
                current_state = STATE_BWD_2;
                ESP_LOGI(TAG, "Cylinder at B & A (Backward)");
            } else if (event == EVENT_SENSOR_B_LOW) {
                current_state = STATE_IDLE;
                ESP_LOGI(TAG, "Wiggle: Returned to IDLE");
            }
            break;

        case STATE_BWD_2:
            if (event == EVENT_SENSOR_B_LOW) {
                current_state = STATE_BWD_3;
                ESP_LOGI(TAG, "Cylinder left B, now at A (Backward)");
            } else if (event == EVENT_SENSOR_A_LOW) {
                current_state = STATE_BWD_1;
                ESP_LOGI(TAG, "Wiggle: Returned to B only");
            }
            break;

        case STATE_BWD_3:
            if (event == EVENT_SENSOR_A_LOW) {
                error_count++;
                current_state = STATE_IDLE;
                ESP_LOGE(TAG, "ERROR! Backward movement detected! Total errors: %lu", error_count);
            } else if (event == EVENT_SENSOR_B_HIGH) {
                current_state = STATE_BWD_2;
                ESP_LOGI(TAG, "Wiggle: Returned to B & A");
            }
            break;

        default:
            current_state = STATE_IDLE;
            break;
    }
}

static void state_machine_task(void *pvParameters) {
    ESP_LOGI(TAG, "State Machine Task Started");
    sensor_event_t evt;

    while (1) {
        if (xQueueReceive(sm_event_queue, &evt, portMAX_DELAY) == pdTRUE) {
            process_event(evt.type);
        }
    }
}

QueueHandle_t init_state_machine(TaskHandle_t update_task) {
    count_update_task = update_task;
    sm_event_queue = xQueueCreate(10, sizeof(sensor_event_t));
    if (sm_event_queue == NULL) {
        ESP_LOGE(TAG, "Failed to create state machine event queue");
        return NULL;
    }

    // Configure gate relay GPIO
    gpio_config_t io_conf = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_OUTPUT,
        .pin_bit_mask = (1ULL << GATE_RELAY_GPIO),
        .pull_down_en = 0,
        .pull_up_en = 0
    };
    gpio_config(&io_conf);
    gpio_set_level(GATE_RELAY_GPIO, 0); // Initially open

    xTaskCreate(state_machine_task, "state_machine_task", 4096, NULL, 10, NULL);
    return sm_event_queue;
}

uint32_t get_cylinder_count(void) {
    return cylinder_count;
}
