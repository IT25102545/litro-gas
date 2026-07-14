# Litro Gas: AI Handover Context

**Date:** July 14, 2026
**Project:** Litro Gas Cylinder Counting System
**Goal:** Transitioning from POC to a robust, local-first production environment.

## 1. System Architecture
This project is an industrial IoT application to monitor and count LPG gas cylinders as they are loaded and unloaded from lorries in a warehouse.

*   **Frontend:** React (Vite) with a custom modern UI, Tailwind-inspired inline CSS.
*   **Backend:** Node.js, Express.js, Socket.IO for real-time updates.
*   **Database:** SQLite (using `better-sqlite3` in WAL mode for synchronous, local persistence).
*   **Hardware (Board):** Custom ESP32 board (`esp32-board/`) programmed in C using ESP-IDF. It handles debounce/counting and HTTP requests.
*   **Deployment Engine:** PM2 (`ecosystem.config.cjs`) for daemonizing the server on a local warehouse Windows PC.

## 2. Recent Development Achievements (What we just finished)
1.  **Local-First Migration:** We removed remote cloud dependencies (like Railway) and moved the backend to a Local Windows PC to prevent warehouse downtime during internet outages.
2.  **SQLite Persistence:** Added robust SQLite logic (`server.js`) so that if the PC crashes, active lorry counts and queue data are perfectly restored on reboot.
3.  **UI Overhaul (Desktop):** Upgraded `SupervisorDashboard.jsx` and `AdminDashboard.jsx` from narrow mobile layouts to expansive, professional 1200px desktop grids with premium shadows, gradients, and hover states.
4.  **Remote Administration:** Created a SuperAdmin panel (`/superadmin`) accessible securely via **Tailscale**. Added an auto-update feature where clicking a button triggers a background shell command to `git pull`, `npm run build`, and `pm2 restart`.
5.  **Board Security & Sync:** We did NOT touch the original developer's state machine logic. We only updated `wifi_http.c/h` to enforce `X-API-Key` headers for security.

## 3. Environment Secrets Required (`.env`)
To run this project on a new PC, ensure the following `.env` is created in the root folder:
```env
NODE_ENV=production
PORT=3001
BOARD_API_KEY=LITRO_SECURE_KEY_2024
ADMIN_PASSWORD=admin123
```

## 4. Instructions for the New AI Agent
If you are an AI assistant reading this on a new PC or a new account:
*   The user has transferred to this machine.
*   All code is actively pushed to GitHub (`IT25102545/litro-gas`).
*   The system is fully complete and ready for deployment.
*   Your current context is fully restored. Prioritize reviewing `server.js` and `SupervisorDashboard.jsx` if the user asks for immediate UI/Backend tweaks.

---
*Generated automatically by Antigravity for seamless workspace transfer.*
