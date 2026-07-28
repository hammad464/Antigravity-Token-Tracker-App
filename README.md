# Antigravity Model Quotas & Token Monitor Desktop Application

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-31.0-47848F?logo=electron&logoColor=white)](https://electronjs.org)
[![Google Antigravity](https://img.shields.io/badge/Google-Antigravity%20IDE-818cf8)](https://antigravity.google)

A powerful, high-aesthetics Electron desktop application designed to track, monitor, and visualize **Google Antigravity IDE** model quotas, rolling 5-hour sprints, dynamic 7-day weekly baseline limits, and real-time "Work Done" compute weight consumption.

---

## 🌟 Key Features

* **⚡ Real-Time IDE Live Sync**: Automatically connects to your running Antigravity IDE process (`http://127.0.0.1:50836`) via Chrome DevTools Protocol to read your **exact account plan, live percentage meters, and refresh countdowns**.
* **🎯 100% Official IDE Settings Alignment**: Structured into the two official IDE model groups:
  1. **`Gemini Models`**: Shares quota between Gemini 3.6 Flash & Gemini 3.1 Pro variants.
  2. **`Claude and GPT models`**: Shares quota between Anthropic Claude Sonnet 4.6, Claude Opus 4.6, and GPT-OSS 120B.
* **📊 Dual-Layer Progress Meters**:
  - **Five Hour Limit**: Tracks short-term burst usage and 5-hour rolling refresh cycles.
  - **Weekly Limit**: Tracks long-term rolling weekly sliding windows and AI Credit Overage triggers.
* **🧠 Work Done Compute Weight Telemetry**: Replaces misleading raw token claims with percentage-based computational weight metrics (**Work Done**), accurately reflecting subagent loops and task complexity.
* **📁 Interactive BPE Token Estimator**: Paste code files or drop prompt text to test context window boundaries across all 11 models.
* **🤖 AI Quotas Assistant Chatbot**: Integrated NLP assistant answering questions about rolling windows, quota resets, and rate limits using official `antigravity.google/docs` rules.

---

## 🚀 Quick Start (Development)

### Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher)
- [npm](https://npmjs.com)
- [Google Antigravity IDE](https://antigravity.google) installed & open on your machine.

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/antigravity-token-tracker.git
   cd antigravity-token-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Launch the application**:
   ```bash
   npm start
   ```

---

## 🛠️ Building the Standalone Windows `.exe` Executable

You can build a standalone Windows `.exe` installer or portable executable using `electron-builder`:

### Build Portable Executable (`.exe`)
```bash
npm run portable
```
This generates a single-file portable executable in the `dist/` folder:
`dist/antigravity-token-tracker 1.0.0.exe`

### Build Full NSIS Windows Installer (`Setup.exe`)
```bash
npm run dist
```
This generates an interactive installer in the `dist/` directory.

---

## 🔗 How Live IDE Sync Works

The application includes a multi-port scanner (`50836`, `9222`, `9229`) in `renderer.js`:

1. When launched, the app queries local Electron debugging ports (`http://127.0.0.1:50836/json/list`).
2. It connects via WebSocket CDP (`Runtime.evaluate`) to your open **Antigravity IDE Settings > Models** screen.
3. The app extracts your **live plan tier** (`Google AI Pro` / `Google AI Ultra`) and real-time usage percentages, displaying them seamlessly on the dashboard.
4. If your IDE is closed, the app operates in **Standalone Mode**, allowing manual model capability exploration and token estimations.

---

## 📂 Project Architecture

```
antigravity-token-tracker/
├── main.js           # Electron main process & desktop window lifecycle
├── preload.js        # IPC context bridge & native desktop window controls
├── index.html        # Glassmorphic user interface & navigation panels
├── styles.css        # Antigravity IDE theme stylesheet & visual progress bars
├── modelsData.js     # Reference dataset for 11 Antigravity models & 2 official groups
├── renderer.js       # Live telemetry DevTools bridge, countdown timers, & AI chatbot engine
├── package.json      # Node.js dependencies & electron-builder packaging rules
└── README.md         # Project documentation
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
