idf_component_register(SRCS "main.c" "sensors.c" "state_machine.c" "wifi_http.c"
                    INCLUDE_DIRS "."
                    REQUIRES esp_wifi esp_event esp_netif esp_http_client nvs_flash)
