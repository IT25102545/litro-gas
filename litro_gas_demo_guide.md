# 🔵 Litro Gas — Bay Management System
## Live Demo Guide

**Live URL:** https://litro-gas-production.up.railway.app

---

## What This System Does

The Litro Gas Bay Management System is a **real-time lorry tracking and bay assignment platform** for LPG cylinder depots. When a lorry arrives at the facility, it is instantly assigned to the most efficient available bay — reducing wait times and eliminating manual coordination.

---

## Quick Links

| Page | URL | Purpose |
|---|---|---|
| 🖥️ Dashboard | https://litro-gas-production.up.railway.app | Main control screen |
| 🔲 QR Generator | https://litro-gas-production.up.railway.app/qr-generator | Create lorry QR codes |
| 📱 Mobile Scanner | https://litro-gas-production.up.railway.app/mobile-scanner | Scan on phone at gate |
| 🔗 Connect Scanner | https://litro-gas-production.up.railway.app/mobile-connect | Get mobile scanner QR |

---

## How to Run the Demo (Step by Step)

### Step 1 — Open the Dashboard
Open the **Dashboard** on a laptop or desktop browser.
You will see **8 bays** (4 Load bays + 4 Unload bays), live statistics, and a queue list. All bays start as **Free** (green).

---

### Step 2 — Generate a Lorry QR Code
1. Open the **QR Generator** page.
2. Fill in the lorry details:
   - **Registration Number** (e.g. `WP LA-1234`)
   - **Selling Point / District** (e.g. `Colombo North`)
   - **Operation Type** → `Load` (filling cylinders) or `Unload` (returning empties)
   - **Target Cylinder Count** (e.g. `120`)
3. Click **"Generate QR Code"**.
4. A unique QR code is generated for that lorry. You can **download** it as an image.

---

### Step 3 — Scan the QR at the Gate (Mobile)
1. On your **mobile phone**, open: https://litro-gas-production.up.railway.app/mobile-scanner
   *(Or go to "Connect Scanner" on the dashboard and scan the QR with your phone camera to open it automatically.)*
2. Tap **"Tap to Scan QR"** and take a photo of the lorry's QR code.
3. The system instantly reads the QR and assigns the lorry to the best available bay.

> **If the camera scan doesn't work:** Tap **"Manual Entry"** to type in the lorry details directly and assign manually.

---

### Step 4 — Watch the Dashboard Update in Real Time
Switch back to the **Dashboard** on the laptop. You will see:
- The assigned bay changes from **Free → Occupied**
- The lorry's registration number and cylinder target appear on the bay card
- The **Queue List** shows which lorry is assigned to which bay
- Live statistics update (Active Bays, Lorries Handled, Cylinders Processed)

---

### Step 5 — Start the Operation
On any Occupied bay card in the Dashboard, click **"Start"**.
- The bay status changes to **In Progress**
- A progress bar fills in real time as cylinders are counted
- Once complete, the bay auto-changes to **Complete**

---

### Step 6 — Clear the Bay
Click **"Clear"** on a completed bay.
- If another lorry is waiting in the queue, it is **automatically moved** into the bay
- The bay returns to **Free** if no queue
- The completed lorry appears in the **Past Lorries** log at the bottom of the dashboard

---

## How Automatic Bay Assignment Works

When a lorry is scanned at the gate, the system:
1. Checks the **operation type** (Load or Unload)
2. Finds all bays matching that type
3. Assigns the lorry to the **bay with the shortest queue**
4. If no bay is free, the lorry joins the queue and waits — displayed on the dashboard in real time

This eliminates the need for a person to manually direct lorries, reducing congestion and idle time at the facility.

---

## System Architecture

```
Mobile Phone (Gate Scanner)
        │
        │  WiFi / 4G
        ▼
   Node.js Server  ──────────  Socket.IO (Real-time)
        │                              │
        ▼                              ▼
  Bay Assignment Logic         Desktop Dashboard
  (Auto-routing engine)        (Live updates, no refresh)
```

- **Frontend:** React.js (runs in any browser)
- **Backend:** Node.js + Express
- **Real-time:** Socket.IO WebSockets
- **QR Scanning:** jsQR (pure JavaScript, works on iPhone Safari)
- **Hosted on:** Railway (24/7 cloud)

---

## Tips for the Demo

- Open the **Dashboard** on one screen and the **Mobile Scanner** on your phone simultaneously to show the real-time sync effect.
- Use the **"Test Mode"** button at the bottom of the Mobile Scanner page to simulate a scan without a QR code — great for quick demos.
- Generate **2–3 different lorry QR codes** beforehand and save them as images on your phone gallery for a smooth presentation.
- You can open the Dashboard in **multiple browser tabs** — all will update simultaneously, demonstrating real-time multi-user capability.

---

*Litro Gas Bay Management System — Demo Version*
*Built with React, Node.js & Socket.IO*
