#ifndef STATE_MACHINE_H
#define STATE_MACHINE_H

#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"

// Initialize the state machine task and return its event queue
// update_task: Optional task handle to notify when count increments
QueueHandle_t init_state_machine(TaskHandle_t update_task);

// Get the current valid cylinder count
uint32_t get_cylinder_count(void);

#endif // STATE_MACHINE_H
