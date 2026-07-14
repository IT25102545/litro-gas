/**
 * wifi_http.h — Litro Gas WiFi + HTTP Connection Layer
 * Configure WIFI_SSID, WIFI_PASSWORD, SERVER_URL, and BAY_ID before flashing.
 */

#ifndef WIFI_HTTP_H
#define WIFI_HTTP_H

#include <stdint.h>
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"

// ─── CONFIGURE THESE ─────────────────────────────────────────────────────────
#define WIFI_SSID           "YOUR_WIFI_SSID"
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"

// Railway production URL — or use "http://192.168.x.x:3001" for local
#define SERVER_URL          "http://litro-gas-production.up.railway.app"

// Must match BOARD_API_KEY in your server's .env file
#define BOARD_API_KEY       "change-this-to-a-secret-key-before-going-live"

// Bay 5 = Unloading bay for this board
#define BAY_ID              5

// API endpoints
#define ENDPOINT_COUNT      "/api/sensor/count"
#define ENDPOINT_COMPLETE   "/api/sensor/complete"
#define ENDPOINT_GATE_CMD   "/api/gate/command"
#define ENDPOINT_ERROR      "/api/sensor/error"   // Board reports error events

// How often the board polls the server for gate commands (milliseconds)
// 2000ms = check every 2 seconds. Lower = faster response, higher = less network traffic.
#define GATE_POLL_MS        2000
// ─────────────────────────────────────────────────────────────────────────────

/** Connect to WiFi. Blocks until connected or max retries reached. */
void wifi_init(void);

/** Report one new cylinder count to the server. */
void http_report_count(uint32_t current_count);

/** Report job complete (called when last-cylinder sensor fires). */
void http_report_complete(uint32_t final_count);

/**
 * Report a board error event to the server.
 * @param error_code  One of: BACKWARD_DETECTION, SENSOR_BLOCKED, GATE_FAIL,
 *                    EMERGENCY_STOP, COMM_LOST, SENSOR_TIMEOUT, UNKNOWN
 */
void http_report_error(const char *error_code);

/**
 * Start a background task that polls /api/gate/command every GATE_POLL_MS.
 * When the server sends "open", it injects EVENT_BUTTON_HIGH into sm_queue,
 * which causes the board's state machine to open the gate relay and reset count.
 *
 * @param sm_queue  The state machine event queue returned by init_state_machine().
 */
void wifi_http_start_gate_polling(QueueHandle_t sm_queue);

#endif // WIFI_HTTP_H
