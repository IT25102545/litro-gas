#ifndef SENSORS_H
#define SENSORS_H

#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"

// Sensor GPIOs based on user request (can be configured)
#define SENSOR_A_GPIO 21
#define SENSOR_B_GPIO 22
#define SENSOR_LAST_CYL_GPIO 26
#define BUTTON_RESUME_GPIO 14

// Event definitions
typedef enum {
    EVENT_SENSOR_A_HIGH,
    EVENT_SENSOR_A_LOW,
    EVENT_SENSOR_B_HIGH,
    EVENT_SENSOR_B_LOW,
    EVENT_LAST_CYL_HIGH,
    EVENT_LAST_CYL_LOW,
    EVENT_BUTTON_HIGH,
    EVENT_BUTTON_LOW
} sensor_event_type_t;

typedef struct {
    sensor_event_type_t type;
    uint32_t timestamp; // Time event occurred, in FreeRTOS ticks
} sensor_event_t;

// Context passed to the generic sensor task
typedef struct {
    int gpio_pin;
    sensor_event_type_t high_event;
    sensor_event_type_t low_event;
    QueueHandle_t event_queue;
} sensor_task_config_t;

void init_sensors(QueueHandle_t event_queue);

#endif // SENSORS_H
