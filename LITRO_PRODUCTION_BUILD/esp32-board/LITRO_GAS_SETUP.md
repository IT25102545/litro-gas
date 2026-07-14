# Litro Gas — ESP32 Board Setup Guide

## Files Added (Board code NOT changed)
| File | Purpose |
|---|---|
| `main/wifi_http.h` | WiFi + HTTP header (NEW — by Litro Gas) |
| `main/wifi_http.c` | WiFi + HTTP implementation (NEW — by Litro Gas) |
| `main/main.c` | Entry point updated to add WiFi init + HTTP reporting |
| `main/CMakeLists.txt` | Updated to include wifi_http.c + ESP-IDF WiFi components |
| `main/sensors.c` | ✅ UNCHANGED |
| `main/sensors.h` | ✅ UNCHANGED |
| `main/state_machine.c` | ✅ UNCHANGED |
| `main/state_machine.h` | ✅ UNCHANGED |

---

## Step 1 — Configure Your WiFi & Server URL

Open `main/wifi_http.h` and set:

```c
#define WIFI_SSID       "YOUR_WIFI_NAME"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"
#define SERVER_URL      "http://litro-gas-production.up.railway.app"
#define BAY_ID          5    // Bay 5 = Unloading
```

---

## Step 2 — Build & Flash

Make sure ESP-IDF is installed, then:

```bash
cd esp32-board
idf.py build
idf.py -p COM3 flash monitor     # Replace COM3 with your port
```

---

## Step 3 — Workflow

```
1. Supervisor logs into /supervisor
2. Selects "Unloading" → enters Lorry Plate + Expected Count → Start
3. ESP32 board starts counting cylinders via sensors A & B
4. Every cylinder → ESP32 POST /api/sensor/count → live count updates on all screens
5. Last cylinder sensor fires → ESP32 POST /api/sensor/complete → job auto-completes
6. Discrepancy is calculated and logged in Admin Panel
```

---

## Server API Endpoints (called by ESP32)

| Method | URL | Body | Description |
|---|---|---|---|
| POST | `/api/sensor/count` | `{"bayId":5,"count":42}` | Report one new count |
| POST | `/api/sensor/complete` | `{"bayId":5,"finalCount":1000}` | Complete the job |

---

## GPIO Pin Map

| GPIO | Sensor | Purpose |
|---|---|---|
| 21 | Sensor A | First beam — detects cylinder entry |
| 22 | Sensor B | Second beam — confirms direction |
| 26 | Last Cylinder | Triggers job completion (fires /api/sensor/complete) |
| 14 | Resume Button | Resets count + opens gate |
| GATE_RELAY_GPIO | Output Relay | Physically closes gate on last cylinder |
