/**
 * Antigravity Quotas & Token Monitor Desktop Application Renderer
 *
 * -----------------------------------------------------------------------
 * WHAT CHANGED IN THIS PASS (read this before assuming any number is real)
 * -----------------------------------------------------------------------
 * 1. Usage % and reset timers are now tracked ONCE PER SHARED POOL
 *    ('gemini_models' / 'claude_gpt_models'), not once per model. The
 *    previous version gave every model in the same pool a different fake
 *    percentage even though the app's own copy says a pool shares one
 *    5-hour limit and one weekly limit - that was self-contradictory.
 *
 * 2. There is no more auto-generated fake data. On first run every number
 *    is "unset" (shown as "—") until you either:
 *      a) successfully live-sync from a running Antigravity IDE, or
 *      b) type the real numbers you see in Antigravity's own
 *         Settings > Models screen into the manual-entry fields.
 *    Manual entry is the reliable path. Live sync is best-effort - see the
 *    big comment above syncLiveIDETelemetry() for why it may never
 *    connect on your machine, and don't take a "Standalone" status as a
 *    bug; it's the honest default.
 *
 * 3. The token estimator now uses real OpenAI-family BPE tokenizers
 *    (cl100k_base, o200k_base) via preload.js + the `gpt-tokenizer`
 *    package, instead of a made-up linear formula. It's still only an
 *    approximation for Gemini/Claude, who don't publish their tokenizer -
 *    the UI says so.
 */

let currentPlan = localStorage.getItem('ag_plan') || 'pro';
let activeFilter = 'all';
let searchQuery = '';

const DEFAULT_GROUP_STATE = () => ({
  gemini_models: { weeklyPct: null, fiveHrPct: null, weeklyResetAt: null, fiveHrResetAt: null, source: 'unset', lastSyncedAt: null },
  claude_gpt_models: { weeklyPct: null, fiveHrPct: null, weeklyResetAt: null, fiveHrResetAt: null, source: 'unset', lastSyncedAt: null }
});

let groupState = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem('ag_group_state'));
    if (saved && saved.gemini_models && saved.claude_gpt_models) return saved;
  } catch (err) { /* fall through to defaults */ }
  return DEFAULT_GROUP_STATE();
})();

function saveGroupState() {
  localStorage.setItem('ag_group_state', JSON.stringify(groupState));
}

const POOL_IDS = ['gemini_models', 'claude_gpt_models'];

const planSelect = document.getElementById('planSelect');
const sidebarTierLabel = document.getElementById('sidebarTierLabel');
const detectedPlanTitle = document.getElementById('detectedPlanTitle');
const detectedPlanDesc = document.getElementById('detectedPlanDesc');
const bannerPlanName = document.getElementById('bannerPlanName');
const bannerPlanBadge = document.getElementById('bannerPlanBadge');

const searchInput = document.getElementById('searchInput');
const filterChips = document.querySelectorAll('.filter-chip');
const navItems = document.querySelectorAll('.nav-item');
const viewPanels = document.querySelectorAll('.view-panel');

const modelsGrid = document.getElementById('modelsGrid');
const renewalsList = document.getElementById('renewalsList');
const specsTableBody = document.getElementById('specsTableBody');
const modelCountLabel = document.getElementById('modelCountLabel');

const calcTextArea = document.getElementById('calcTextArea');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const btnUploadFile = document.getElementById('btnUploadFile');
const calcCharCount = document.getElementById('calcCharCount');
const calcWordCount = document.getElementById('calcWordCount');
const calcLineCount = document.getElementById('calcLineCount');
const calcTokenCount = document.getElementById('calcTokenCount');
const calcModelBars = document.getElementById('calcModelBars');

const chatInput = document.getElementById('chatInput');
const btnSendChat = document.getElementById('btnSendChat');
const chatMessages = document.getElementById('chatMessages');

const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalBadge = document.getElementById('modalBadge');
const modalSubtitle = document.getElementById('modalSubtitle');
const modalBody = document.getElementById('modalBody');

document.addEventListener('DOMContentLoaded', () => {
  initDesktopControls();
  initEventListeners();
  initManualEntryControls();

  planSelect.value = currentPlan;
  detectSubscriptionPlan();
  renderAll();

  // Try a live sync immediately, then retry periodically. This never
  // overwrites data with fake numbers - see syncLiveIDETelemetry().
  syncLiveIDETelemetry();
  setInterval(syncLiveIDETelemetry, 10000);

  // Visual-only tick (countdown timers, etc). Does NOT invent new data.
  setInterval(tickTelemetry, 1000);
});

function initDesktopControls() {
  if (window.electronAPI) {
    document.getElementById('btnMinimize')?.addEventListener('click', () => window.electronAPI.minimizeWindow());
    document.getElementById('btnMaximize')?.addEventListener('click', () => window.electronAPI.maximizeWindow());
    document.getElementById('btnClose')?.addEventListener('click', () => window.electronAPI.closeWindow());
  }
}

function detectSubscriptionPlan() {
  const planInfo = ANTIGRAVITY_PLANS[currentPlan];
  if (detectedPlanTitle) detectedPlanTitle.textContent = planInfo.name;
  if (detectedPlanDesc) detectedPlanDesc.textContent = `${planInfo.badge} • Antigravity License (selected manually below - not auto-detected)`;
  if (bannerPlanName) bannerPlanName.textContent = planInfo.name;
  if (bannerPlanBadge) bannerPlanBadge.textContent = 'PLAN: ' + planInfo.id.toUpperCase();
}

/**
 * ---------------------------------------------------------------------
 * LIVE IDE SYNC - READ THIS BEFORE TRUSTING A "Live Synced" STATUS
 * ---------------------------------------------------------------------
 * This scans a few common Chrome DevTools Protocol (CDP) ports on
 * localhost, and if Antigravity (an Electron/VS Code-based app) happens
 * to be running with a remote-debugging port open, it asks the page for
 * its visible text and tries to parse the quota screen out of it.
 *
 * Important limitations, stated plainly:
 *  - Most Electron/VS Code-based apps do NOT expose a CDP port unless
 *    they were launched with a flag like --remote-debugging-port=9222.
 *    If Antigravity wasn't started that way, every attempt below will
 *    simply fail to connect - that's expected, not a bug, and this
 *    build cannot force Antigravity to open that port for you.
 *  - Even when connected, parseAndApplyIDEText() below is a best-effort
 *    text parser written from the phrases visible in the app's own
 *    screenshots/README, NOT verified against Antigravity's real DOM
 *    output (no live instance was available while writing this). If
 *    Antigravity's actual wording or layout differs, the regexes may
 *    need adjusting - check the browser DevTools console for
 *    "[antigravity-sync]" log lines if percentages look wrong.
 *  - This never fabricates a percentage. If nothing parses, the UI keeps
 *    showing "—" / your last manual entry instead of a guess.
 */
async function syncLiveIDETelemetry() {
  const portsToScan = [9222, 9229, 50836];
  let connectedAny = false;

  for (const port of portsToScan) {
    try {
      const res = await fetchWithTimeout(`http://127.0.0.1:${port}/json/list`, 800);
      if (!res || !res.ok) continue;
      const list = await res.json();
      const target = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (!target) continue;

      const text = await readPageTextViaCDP(target.webSocketDebuggerUrl, 2000);
      if (text) {
        const parsed = parseAndApplyIDEText(text);
        if (parsed) {
          connectedAny = true;
          updateStatusPill('live', `Live Synced (port ${port})`);
          renderAll();
        }
      }
    } catch (err) {
      // Try the next port silently - this is expected on most machines.
    }
  }

  if (!connectedAny) {
    const anyManual = POOL_IDS.some(id => groupState[id].source === 'manual');
    const anyData = POOL_IDS.some(id => groupState[id].source !== 'unset');
    if (anyManual) {
      updateStatusPill('manual', 'Standalone Mode (Manual Data)');
    } else if (!anyData) {
      updateStatusPill('offline', 'Standalone Mode (No Data Yet)');
    }
  }
}

function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(t));
}

function readPageTextViaCDP(wsUrl, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    let ws;
    const timer = setTimeout(() => {
      if (!settled) { settled = true; try { ws && ws.close(); } catch (e) {} resolve(null); }
    }, timeoutMs);

    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      clearTimeout(timer);
      resolve(null);
      return;
    }

    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: 'document.body.innerText', returnByValue: true }
      }));
    };
    ws.onmessage = (evt) => {
      if (settled) return;
      try {
        const resp = JSON.parse(evt.data);
        if (resp.id === 1) {
          settled = true;
          clearTimeout(timer);
          const value = resp.result && resp.result.result && resp.result.result.value;
          ws.close();
          resolve(value || null);
        }
      } catch (err) {
        settled = true;
        clearTimeout(timer);
        try { ws.close(); } catch (e) {}
        resolve(null);
      }
    };
    ws.onerror = () => {
      if (!settled) { settled = true; clearTimeout(timer); resolve(null); }
    };
  });
}

/**
 * Best-effort parse of the IDE's "Model Quota" screen text into our
 * two-pool state. See the big caveat comment above syncLiveIDETelemetry.
 * Returns true if it found at least one usable number.
 */
function parseAndApplyIDEText(text) {
  if (!text || typeof text !== 'string') return false;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const pctRegex = /(\d{1,3})\s?%/;
  const timeRegex = /refresh(?:es)?[^.\n]*?in\s+(?:(\d+)\s*hours?)?[,\s]*(?:(\d+)\s*minutes?)?/i;

  let currentPool = null;
  let found = false;
  const now = Date.now();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/gemini models/i.test(line)) { currentPool = 'gemini_models'; continue; }
    if (/claude and gpt models/i.test(line)) { currentPool = 'claude_gpt_models'; continue; }
    if (!currentPool) continue;

    const isWeekly = /weekly limit/i.test(line);
    const isFiveHr = /five[\s-]?hour limit|5[\s-]?hour limit/i.test(line);
    if (!isWeekly && !isFiveHr) continue;

    let pct = null;
    let resetMs = null;
    for (let j = i; j < Math.min(lines.length, i + 4); j++) {
      if (pct === null) {
        const pm = lines[j].match(pctRegex);
        if (pm) pct = Math.max(0, Math.min(100, parseInt(pm[1], 10)));
      }
      if (resetMs === null) {
        const tm = lines[j].match(timeRegex);
        if (tm) {
          const hrs = parseInt(tm[1] || '0', 10);
          const mins = parseInt(tm[2] || '0', 10);
          if (hrs || mins) resetMs = now + (hrs * 3600 + mins * 60) * 1000;
        }
      }
    }

    if (pct !== null) {
      found = true;
      const g = groupState[currentPool];
      if (isWeekly) {
        g.weeklyPct = pct;
        if (resetMs) g.weeklyResetAt = resetMs;
      } else {
        g.fiveHrPct = pct;
        if (resetMs) g.fiveHrResetAt = resetMs;
      }
      g.source = 'live';
      g.lastSyncedAt = now;
    }
  }

  if (found) saveGroupState();
  else console.log('[antigravity-sync] connected to a CDP target but did not recognize its layout - see parseAndApplyIDEText().');
  return found;
}

function updateStatusPill(kind, text) {
  const statusDot = document.getElementById('statusDot') || document.querySelector('.status-dot');
  const statusText = document.getElementById('statusText');
  if (statusDot) {
    statusDot.className = `status-dot ${kind === 'live' ? 'online' : (kind === 'manual' ? 'stale' : 'offline')}`;
  }
  if (statusText) statusText.textContent = text;
}

/**
 * MANUAL ENTRY - the honest, reliable path: type in what Antigravity's
 * own Settings > Models screen shows you.
 */
function initManualEntryControls() {
  wireManualPool('gemini', 'gemini_models');
  wireManualPool('claude', 'claude_gpt_models');
  reflectManualInputs();
}

function wireManualPool(prefix, poolId) {
  const btn = document.getElementById(`${prefix}ManualSave`);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const weeklyPct = document.getElementById(`${prefix}WeeklyInput`).value;
    const fiveHrPct = document.getElementById(`${prefix}5hrInput`).value;
    const weeklyHrs = document.getElementById(`${prefix}WeeklyResetHrsInput`).value;
    const fiveHrHrs = document.getElementById(`${prefix}5hrResetHrsInput`).value;

    const g = groupState[poolId];
    const now = Date.now();
    let changed = false;

    if (weeklyPct !== '') { g.weeklyPct = clampPct(weeklyPct); changed = true; }
    if (fiveHrPct !== '') { g.fiveHrPct = clampPct(fiveHrPct); changed = true; }
    if (weeklyHrs !== '') { g.weeklyResetAt = now + parseFloat(weeklyHrs) * 3600000; changed = true; }
    if (fiveHrHrs !== '') { g.fiveHrResetAt = now + parseFloat(fiveHrHrs) * 3600000; changed = true; }

    if (changed) {
      g.source = 'manual';
      saveGroupState();
      renderAll();
    }
  });
}

function clampPct(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return null;
  return Math.max(0, Math.min(100, n));
}

function reflectManualInputs() {
  ['gemini', 'claude'].forEach((prefix) => {
    const poolId = prefix === 'gemini' ? 'gemini_models' : 'claude_gpt_models';
    const g = groupState[poolId];
    const now = Date.now();
    const weeklyEl = document.getElementById(`${prefix}WeeklyInput`);
    const fiveHrEl = document.getElementById(`${prefix}5hrInput`);
    if (weeklyEl && g.weeklyPct !== null) weeklyEl.value = g.weeklyPct;
    if (fiveHrEl && g.fiveHrPct !== null) fiveHrEl.value = g.fiveHrPct;
    const weeklyHrsEl = document.getElementById(`${prefix}WeeklyResetHrsInput`);
    const fiveHrHrsEl = document.getElementById(`${prefix}5hrResetHrsInput`);
    if (weeklyHrsEl && g.weeklyResetAt) weeklyHrsEl.value = (Math.max(0, g.weeklyResetAt - now) / 3600000).toFixed(1);
    if (fiveHrHrsEl && g.fiveHrResetAt) fiveHrHrsEl.value = (Math.max(0, g.fiveHrResetAt - now) / 3600000).toFixed(1);
  });
}

function formatNumber(num) { return new Intl.NumberFormat('en-US').format(Math.floor(num)); }

function formatHoursMinutes(ms) {
  if (ms === null || ms === undefined) return 'Unknown (not synced/entered)';
  if (ms <= 0) return '0 minutes';
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}, ${mins} minute${mins !== 1 ? 's' : ''}`;
  return `${mins} minute${mins !== 1 ? 's' : ''}`;
}

function formatCountdown(ms) {
  if (ms === null || ms === undefined) return 'Not set';
  if (ms <= 0) return '00h 00m 00s (Resetting...)';
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

function updatePlanDisplay() {
  currentPlan = planSelect.value;
  localStorage.setItem('ag_plan', currentPlan);
  detectSubscriptionPlan();
  const planInfo = ANTIGRAVITY_PLANS[currentPlan];
  sidebarTierLabel.textContent = planInfo.name;
  renderAll();
}

/**
 * UPDATE OFFICIAL IDE QUOTA CARDS - reads the two shared-pool states
 * directly. No per-model averaging: a pool has exactly one number.
 */
function renderSummaryStats() {
  const now = Date.now();

  renderPoolCard('gemini', groupState.gemini_models, now);
  renderPoolCard('claude', groupState.claude_gpt_models, now);
}

function renderPoolCard(prefix, g, now) {
  const weeklyMs = g.weeklyResetAt ? Math.max(0, g.weeklyResetAt - now) : null;
  const fiveHrMs = g.fiveHrResetAt ? Math.max(0, g.fiveHrResetAt - now) : null;

  const wBar = document.getElementById(`${prefix}WeeklyBar`);
  const wPct = document.getElementById(`${prefix}WeeklyPct`);
  const wDesc = document.getElementById(`${prefix}WeeklyDesc`);
  const fBar = document.getElementById(`${prefix}5hrBar`);
  const fPct = document.getElementById(`${prefix}5hrPct`);
  const fDesc = document.getElementById(`${prefix}5hrDesc`);
  const tag = document.getElementById(`${prefix === 'gemini' ? 'geminiSourceTag' : 'claudeSourceTag'}`);

  if (wBar) wBar.style.width = `${g.weeklyPct ?? 0}%`;
  if (wPct) wPct.textContent = g.weeklyPct === null ? '—' : `${g.weeklyPct.toFixed(0)}%`;
  if (wDesc) {
    wDesc.textContent = g.weeklyPct === null
      ? 'No usage data yet. Sync Antigravity IDE or enter it manually below.'
      : `You have used some of your weekly limit. It will fully refresh in ${formatHoursMinutes(weeklyMs)}.`;
  }

  if (fBar) fBar.style.width = `${g.fiveHrPct ?? 0}%`;
  if (fPct) fPct.textContent = g.fiveHrPct === null ? '—' : `${g.fiveHrPct.toFixed(0)}%`;
  if (fDesc) {
    fDesc.textContent = g.fiveHrPct === null
      ? 'No usage data yet. Sync Antigravity IDE or enter it manually below.'
      : (g.fiveHrPct >= 98
        ? `You have hit your 5-hour limit. It will refresh in ${formatHoursMinutes(fiveHrMs)}. If on a supported paid plan, you can use AI credits in the interim.`
        : `You have used some of your 5-hour limit. It will fully refresh in ${formatHoursMinutes(fiveHrMs)}.`);
  }

  if (tag) {
    tag.textContent = g.source === 'live' ? 'Live synced' : (g.source === 'manual' ? 'Manual entry' : 'No data yet');
    tag.className = `data-source-tag ${g.source === 'live' ? 'live' : (g.source === 'manual' ? 'manual' : '')}`;
  }
}

/**
 * RENDER MODELS GRID - every model reads its shared pool's ONE set of
 * numbers, instead of its own independently-faked percentage.
 */
function renderModelsGrid() {
  modelsGrid.innerHTML = '';
  const filtered = ANTIGRAVITY_MODELS.filter(m => {
    if (activeFilter === 'gemini' && m.providerKey !== 'gemini') return false;
    if (activeFilter === 'anthropic' && m.providerKey !== 'anthropic') return false;
    if (activeFilter === 'oss' && m.providerKey !== 'oss' && m.providerKey !== 'openai') return false;
    if (activeFilter === 'fast' && m.speedClass !== 'fast') return false;
    if (activeFilter === 'thinking' && m.speedClass !== 'thinking' && !m.reasoning) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    }
    return true;
  });

  modelCountLabel.textContent = filtered.length;
  const now = Date.now();

  filtered.forEach(m => {
    const g = groupState[m.sharedPool];
    const used5hr = g.fiveHrPct;
    const usedWeekly = g.weeklyPct;
    const hasData = used5hr !== null;
    const is5hrExhausted = hasData && used5hr >= 98;

    const msLeft5hr = g.fiveHrResetAt ? Math.max(0, g.fiveHrResetAt - now) : null;
    const msLeftWeekly = g.weeklyResetAt ? Math.max(0, g.weeklyResetAt - now) : null;

    const card = document.createElement('div');
    card.className = `model-card ${is5hrExhausted ? 'locked-out-card' : ''}`;
    card.dataset.modelId = m.id;

    card.innerHTML = `
      <div>
        <div class="model-card-header">
          <span class="provider-tag ${m.providerKey}">${m.provider}</span>
          <span class="speed-badge ${m.speedClass}">${m.speedBadge}</span>
        </div>
        <h3 class="model-title">${m.name}</h3>
        <p class="model-desc">Shares <strong>${m.poolDisplayName}</strong>. ${m.description}</p>

        <!-- FIVE HOUR LIMIT GAUGE -->
        <div class="quota-gauge-container">
          <div class="gauge-header">
            <span class="gauge-label">Five Hour Limit</span>
            <span class="gauge-stats gauge-5hr-stats">${hasData ? (100 - used5hr).toFixed(0) + '% Capacity' : 'No data'}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill gauge-5hr-fill ${hasData && used5hr > 85 ? 'warning' : ''}" style="width: ${hasData ? 100 - used5hr : 0}%; background: ${is5hrExhausted ? '#ef4444' : '#10b981'};"></div>
          </div>
          <div class="gauge-footer">
            <span>Group: <strong>${m.poolDisplayName}</strong></span>
            <div class="timer-pill" data-timer-id="${m.id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span class="sprint-timer-text">${is5hrExhausted ? 'EXHAUSTED' : formatCountdown(msLeft5hr)}</span>
            </div>
          </div>
        </div>

        <!-- WEEKLY LIMIT GAUGE -->
        <div class="quota-gauge-container" style="margin-bottom: 0;">
          <div class="gauge-header">
            <span class="gauge-label" style="color: #f59e0b;">Weekly Limit</span>
            <span class="gauge-stats gauge-weekly-stats">${usedWeekly === null ? 'No data' : usedWeekly.toFixed(0) + '% Used'}</span>
          </div>
          <div class="progress-bar-bg baseline-bg">
            <div class="progress-bar-fill baseline-fill gauge-weekly-fill" style="width: ${usedWeekly ?? 0}%;"></div>
          </div>

          <div class="gauge-footer" style="margin-top: 4px;">
            <span>Rolling Reset:</span>
            <div class="timer-pill weekly-timer-pill" style="border-color: rgba(245, 158, 11, 0.4); color: #fbbf24;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span class="weekly-timer-text">${formatHoursMinutes(msLeftWeekly)}</span>
            </div>
          </div>

          ${is5hrExhausted ? `
            <div class="lockout-warning-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>5-HOUR LIMIT HIT — Use AI Credits to continue</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="model-footer-row" style="margin-top: 14px;">
        <span class="context-pill">Context: ${(m.contextWindow / 1000).toFixed(0)}K</span>
        <button class="btn-card-details" onclick="openModelModal('${m.id}')">View Details</button>
      </div>
    `;
    modelsGrid.appendChild(card);
  });
}

function renderRenewalsList() {
  renewalsList.innerHTML = '';
  const now = Date.now();
  const sorted = [...ANTIGRAVITY_MODELS].sort((a, b) => {
    const aMs = groupState[a.sharedPool].fiveHrResetAt ? groupState[a.sharedPool].fiveHrResetAt - now : Infinity;
    const bMs = groupState[b.sharedPool].fiveHrResetAt ? groupState[b.sharedPool].fiveHrResetAt - now : Infinity;
    return aMs - bMs;
  });

  sorted.forEach(m => {
    const g = groupState[m.sharedPool];
    const msLeft5hr = g.fiveHrResetAt ? Math.max(0, g.fiveHrResetAt - now) : null;
    const msLeftWeekly = g.weeklyResetAt ? Math.max(0, g.weeklyResetAt - now) : null;
    const card = document.createElement('div');
    card.className = 'renewal-card';
    card.innerHTML = `
      <div class="renewal-info">
        <span class="provider-tag ${m.providerKey}">${m.provider}</span>
        <div>
          <div class="renewal-name">${m.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">Shares ${m.poolDisplayName} • Work Done Weight: ${m.workDoneWeight}</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div class="renewal-timer" style="font-size: 12px; color: #34d399;">5-Hr Limit: ${formatCountdown(msLeft5hr)}</div>
        <div class="renewal-timer" style="font-size: 11px; color: #fbbf24; margin-top: 2px;">Weekly Reset: ${formatHoursMinutes(msLeftWeekly)}</div>
      </div>
    `;
    renewalsList.appendChild(card);
  });
}

function renderSpecsTable() {
  specsTableBody.innerHTML = '';
  ANTIGRAVITY_MODELS.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${m.name}</strong></td>
      <td><span class="provider-tag ${m.providerKey}">${m.provider}</span></td>
      <td><span class="speed-badge ${m.speedClass}">${m.speedBadge}</span></td>
      <td>${(m.contextWindow / 1000).toFixed(0)}K</td>
      <td>${(m.maxOutputTokens / 1000).toFixed(0)}K</td>
      <td><strong>${m.workDoneWeight}</strong></td>
      <td><strong>${m.poolDisplayName}</strong></td>
      <td>5H Sprint / Rolling Weekly</td>
    `;
    specsTableBody.appendChild(tr);
  });
}

/**
 * VISUAL-ONLY TICK (1000ms) - re-renders from existing state so
 * countdowns move. It does not invent or change any underlying data.
 */
function tickTelemetry() {
  renderSummaryStats();
  renderModelsGrid();
  renderRenewalsList();
}

/**
 * TOKEN ESTIMATOR - real BPE tokenizers via the Electron preload bridge.
 * Falls back to a labeled heuristic ONLY if that bridge isn't available
 * (e.g. running index.html outside Electron), and says so on-screen.
 */
function updateTokenEstimate() {
  const text = calcTextArea.value;
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  let estTokens = 0;
  let sourceLabel = 'No text entered yet.';

  if (text.length > 0) {
    const bridgeCounts = (window.electronAPI && typeof window.electronAPI.countTokens === 'function')
      ? window.electronAPI.countTokens(text)
      : null;

    if (bridgeCounts && bridgeCounts.cl100k !== null && bridgeCounts.cl100k !== undefined) {
      estTokens = bridgeCounts.cl100k;
      sourceLabel = `Real BPE tokenizer — cl100k_base (GPT-4/3.5): ${formatNumber(bridgeCounts.cl100k)} tokens · o200k_base (GPT-4o): ${formatNumber(bridgeCounts.o200k)} tokens. Gemini/Claude approximate.`;
    } else {
      const symbolMatches = text.match(/[{}[\]();:,.<>/?!@#$%^&*+\-=/\\|'"`~]/g) || [];
      estTokens = Math.max(1, Math.ceil((words * 1.32) + (symbolMatches.length * 0.65) + (lines * 0.2)));
      sourceLabel = 'Fallback heuristic only (Electron tokenizer bridge unavailable) — treat as rough, not exact.';
    }
  }

  calcCharCount.textContent = formatNumber(chars);
  calcWordCount.textContent = formatNumber(words);
  calcLineCount.textContent = formatNumber(lines);
  calcTokenCount.textContent = formatNumber(estTokens);
  const labelEl = document.getElementById('calcTokenSourceLabel');
  if (labelEl) labelEl.textContent = sourceLabel;

  calcModelBars.innerHTML = '';
  ANTIGRAVITY_MODELS.forEach(m => {
    const cap = m.contextWindow;
    const pct = estTokens === 0 ? 0 : Math.min(100, (estTokens / cap) * 100);
    const fits = estTokens <= cap;
    let barColor = fits ? (pct > 85 ? '#ec4899' : (pct > 50 ? '#fbbf24' : '#34d399')) : '#ef4444';

    const item = document.createElement('div');
    item.className = 'calc-bar-item';
    item.innerHTML = `
      <div class="calc-bar-header">
        <span class="calc-bar-name">${m.name}</span>
        <span class="calc-bar-pct" style="color: ${fits ? barColor : '#f87171'}">
          ${estTokens === 0 ? '0%' : pct.toFixed(2) + '% context'} ${fits ? '✓ Fits' : '⚠️ Exceeds'}
        </span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: ${Math.min(100, pct)}%; background: ${barColor}"></div>
      </div>
    `;
    calcModelBars.appendChild(item);
  });
}

function handleSendMessage() {
  const query = chatInput.value.trim();
  if (!query) return;
  appendChatMessage('user', 'You', query);
  chatInput.value = '';
  setTimeout(() => {
    const aiResponse = generateAIResponse(query);
    appendChatMessage('assistant', 'Antigravity Quota Assistant', aiResponse);
  }, 350);
}

window.sendSuggestedPrompt = function (promptText) {
  chatInput.value = promptText;
  handleSendMessage();
};

function appendChatMessage(sender, author, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${sender}`;
  msgDiv.innerHTML = `
    <div class="msg-avatar">${sender === 'user' ? 'YOU' : 'AI'}</div>
    <div class="msg-content"><div class="msg-author">${author}</div><div>${text}</div></div>
  `;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * RULE-BASED FAQ ENGINE (keyword matching against a fixed set of topics).
 * This is NOT a language model - it cannot answer arbitrary questions,
 * despite what the old copy implied. Renamed/labeled honestly in the UI.
 */
function generateAIResponse(userText) {
  const q = userText.toLowerCase();

  if (q.includes('group') || q.includes('claude and gpt') || q.includes('gemini models') || q.includes('shared')) {
    return `<strong>Antigravity's documented model groups (Settings > Models):</strong><br><br>` +
      `Within each group, models share one weekly limit and one 5-hour limit, and quota is consumed proportionally to token cost - so limits last longer with shorter tasks or cheaper models.<br><br>` +
      `The 2 groups are:<br>` +
      `1. <strong>Gemini Models:</strong> Shares Gemini Flash &amp; Gemini Pro models.<br>` +
      `2. <strong>Claude and GPT models:</strong> Shares Claude Sonnet 4.6, Claude Opus 4.6, and GPT-OSS 120B.<br><br>` +
      `<em>Note: this app cannot independently verify these figures against your live Antigravity account unless you sync or enter your real numbers - it's repeating documented behavior, not something it measured.</em>`;
  }

  if (q.includes('5-hour limit') || q.includes('five hour') || q.includes('credits') || q.includes('overage')) {
    return `<strong>5-Hour Limit behavior (as documented in Antigravity's Settings > Models):</strong><br><br>` +
      `When a group's 5-hour limit is exhausted, its weekly limit stops applying until the 5-hour limit refreshes. If you're on a paid plan, AI credits can cover you in the interim.<br><br>` +
      `Check the "Model Quotas" tab in this app for your actual current numbers - manually entered or live-synced, not this FAQ.`;
  }

  return `Regarding: <em>"${userText}"</em><br><br>` +
    `I can only answer from a small fixed set of topics (I'm rule-based, not a live model):<br>` +
    `&bull; Shared model pools (<strong>Gemini Models</strong> vs <strong>Claude and GPT models</strong>)<br>` +
    `&bull; How the 5-hour limit and weekly limit interact<br>` +
    `&bull; Where to find your real numbers: the "Model Quotas" tab, or Antigravity's own Settings &gt; Models screen.<br><br>` +
    `Try one of the suggested questions on the left for a direct answer.`;
}

window.openModelModal = function (id) {
  const m = ANTIGRAVITY_MODELS.find(x => x.id === id);
  if (!m) return;
  const g = groupState[m.sharedPool];
  const now = Date.now();
  const msLeftWeekly = g.weeklyResetAt ? Math.max(0, g.weeklyResetAt - now) : null;

  modalBadge.textContent = m.provider;
  modalTitle.textContent = m.name;
  modalSubtitle.textContent = m.variant + ' • ' + m.speedBadge;
  modalBody.innerHTML = `
    <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">${m.description}</p>
    <div style="margin-top: 12px;">
      <div class="modal-spec-row">
        <span class="modal-spec-label">Context Window Limit</span>
        <span class="modal-spec-val">${(m.contextWindow / 1000).toFixed(0)}K Tokens</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Official Model Group</span>
        <span class="modal-spec-val">${m.poolDisplayName}</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Work Done Compute Weight</span>
        <span class="modal-spec-val">${m.workDoneWeight}</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">5-Hour Refresh Cycle</span>
        <span class="modal-spec-val">Rolling 5-Hour Limit (shared across group)</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Weekly Rolling Reset</span>
        <span class="modal-spec-val" style="color: #fbbf24;">${formatHoursMinutes(msLeftWeekly)}</span>
      </div>
    </div>
  `;
  modalOverlay.classList.add('active');
};

function initEventListeners() {
  planSelect.addEventListener('change', updatePlanDisplay);
  searchInput.addEventListener('input', (e) => { searchQuery = e.target.value; renderModelsGrid(); });
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderModelsGrid();
    });
  });

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      viewPanels.forEach(v => v.classList.remove('active'));
      item.classList.add('active');
      const tab = item.dataset.tab;
      if (tab === 'dashboard') document.getElementById('viewDashboard').classList.add('active');
      if (tab === 'renewals') document.getElementById('viewRenewals').classList.add('active');
      if (tab === 'calculator') { document.getElementById('viewCalculator').classList.add('active'); updateTokenEstimate(); }
      if (tab === 'chatbot') document.getElementById('viewChatbot').classList.add('active');
      if (tab === 'specs') document.getElementById('viewSpecs').classList.add('active');
    });
  });

  document.getElementById('btnRefresh')?.addEventListener('click', () => { syncLiveIDETelemetry(); });
  calcTextArea.addEventListener('input', updateTokenEstimate);
  btnUploadFile?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = (evt) => { calcTextArea.value = evt.target.result; updateTokenEstimate(); };
      reader.readAsText(e.target.files[0]);
    }
  });

  document.getElementById('btnClearCalc')?.addEventListener('click', () => { calcTextArea.value = ''; updateTokenEstimate(); });
  document.getElementById('btnSampleCode')?.addEventListener('click', () => {
    calcTextArea.value = `// Antigravity Agentic Execution Pipeline\nimport { AntigravitySDK } from '@antigravity/sdk';\n\nexport async function orchestrateTask(prompt) {\n  const agent = await AntigravitySDK.leaseAgent({\n    model: 'gemini-3.6-flash-high',\n    contextWindow: 1048576,\n    tools: ['file_reader', 'code_editor', 'terminal_runner']\n  });\n\n  const plan = await agent.createPlan(prompt);\n  return agent.execute(plan);\n}`;
    updateTokenEstimate();
  });

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      const reader = new FileReader();
      reader.onload = (evt) => { calcTextArea.value = evt.target.result; updateTokenEstimate(); };
      reader.readAsText(e.dataTransfer.files[0]);
    }
  });

  btnSendChat?.addEventListener('click', handleSendMessage);
  chatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSendMessage(); });
  modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('active'); });
}

function renderAll() {
  renderSummaryStats();
  renderModelsGrid();
  renderRenewalsList();
  renderSpecsTable();
  reflectManualInputs();
}
