# Antigravity Model Quotas & Token Monitor Desktop Application

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-31.0-47848F?logo=electron&logoColor=white)](https://electronjs.org)

An Electron desktop app for tracking **Google Antigravity IDE** model quotas: the two shared model pools (`Gemini Models` and `Claude and GPT models`), their 5-hour and weekly limits, and a token estimator for checking prompt/file size against each model's context window.

> This README was corrected after an audit found the previous version's headline feature ("Real-Time IDE Live Sync") was dead code that never ran, all displayed numbers were random/fake, and the token counter used a made-up formula instead of a real tokenizer. What's described below is what the app actually does, verified by running it.

---

## What actually works right now

* **Manual usage tracking (reliable)** — Type the weekly % and 5-hour % you see in Antigravity's own **Settings > Models** screen into the two group cards on the Dashboard, plus how many hours until each resets. The app stores this per **shared pool**, not per model, because that's how Antigravity's quotas actually work — every model in a pool shares one number, not eleven different ones.
* **Live IDE sync (best-effort, likely won't connect by default)** — On load and every 10 seconds, the app scans a few localhost Chrome DevTools Protocol ports to see if Antigravity happens to be running with remote debugging exposed, and if so, tries to read its quota screen text. Most Electron/VS Code-based apps, including likely Antigravity, do **not** expose that port unless started with a flag like `--remote-debugging-port=9222`. If it can't connect, the status pill honestly says **"Standalone Mode"** rather than pretending to be synced. This code path has not been verified against a real running Antigravity instance — if you get it connected and the numbers look wrong, check the DevTools console for `[antigravity-sync]` logs and adjust `parseAndApplyIDEText()` in `renderer.js` to match what your IDE actually renders.
* **Token estimator (real tokenizer)** — Uses the real `cl100k_base` (GPT-4/3.5) and `o200k_base` (GPT-4o) BPE tokenizers via the `gpt-tokenizer` package, run in the Electron preload script. This is an exact count for OpenAI-family models and a close, industry-standard approximation for Gemini/Claude, whose tokenizers aren't public — the UI states this plainly rather than implying exact counts for every model.
* **Model specs reference** — Context windows, max output, reasoning support, and shared-pool grouping for all 11 listed models (static reference data, not live-fetched).
* **Quota FAQ** — A small rule-based keyword matcher answering a handful of fixed questions about how the shared pools and 5-hour/weekly limits interact. It is explicitly labeled as rule-based, not a live AI model, since it can't actually answer arbitrary questions.

## What it does NOT do

* It cannot detect your Antigravity plan tier automatically — the plan selector is a manual dropdown.
* It cannot guarantee a live connection to Antigravity — that depends on Antigravity exposing a debug port, which is outside this app's control.
* It does not give an exact token count for Gemini or Claude prompts — no public tokenizer exists for either, so any tool claiming an exact count for them is approximating too.

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org) (v18+)
- [npm](https://npmjs.com)

### Install & run
```bash
npm install
npm start
```

### Build a Windows executable
```bash
npm run portable   # single-file portable .exe
npm run dist       # NSIS installer
```

---

## Using it

1. Open the **Model Quotas** tab.
2. Open Antigravity's own **Settings > Models** screen and read off the weekly %, 5-hour %, and time-to-reset for each of the two groups.
3. Type those into the matching fields under each group card and click **Save**. The card, every model tile in that pool, and the Renewal Schedules tab will all update consistently (they read from the same shared state now).
4. Use **Token Estimator** to paste code/prompts and check size against each model's context window.

---

## Project structure

```
├── main.js           # Electron main process, window lifecycle, icon
├── preload.js        # contextBridge API + real BPE tokenizer (gpt-tokenizer)
├── index.html         # UI markup, including manual-entry controls
├── styles.css         # Theme + manual-entry/data-source styling
├── modelsData.js      # Static reference dataset for 11 models & 2 shared pools
├── renderer.js        # All app logic: rendering, manual entry, live-sync attempt, FAQ
├── assets/icon.png     # App icon (placeholder - swap for your own artwork)
├── package.json        # Dependencies (electron, electron-builder, gpt-tokenizer)
└── README.md
```

---

## License

Distributed under the MIT License. See `LICENSE` for details.
