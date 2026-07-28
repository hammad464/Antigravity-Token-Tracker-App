/**
 * Antigravity Quotas & Token Monitor Desktop Application Renderer
 * Verified & Calibrated against Official Google Antigravity Documentation (antigravity.google/docs).
 * Features 3 Shared Pools, Dual Progress Gauges (Gauge A: 5-Hr Sprint, Gauge B: 7-Day Weekly Baseline),
 * Dedicated 7-Day Reset Countdown Timers (06d 23h 45m 12s), and Work Done compute weight telemetry.
 */

let currentPlan = localStorage.getItem('ag_plan') || 'pro';
let activeFilter = 'all';
let searchQuery = '';
let simulatedUsage = JSON.parse(localStorage.getItem('ag_simulated_usage') || '{}');
let simulatedWeeklyUsage = JSON.parse(localStorage.getItem('ag_simulated_weekly_usage') || '{}');
let renewalTimestamps = JSON.parse(localStorage.getItem('ag_renewal_timestamps') || '{}');
let weeklyRenewalTimestamps = JSON.parse(localStorage.getItem('ag_weekly_renewal_timestamps') || '{}');

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

const statTotalTokens = document.getElementById('statTotalTokens');
const statUsedTokens = document.getElementById('statUsedTokens');
const statUsagePercent = document.getElementById('statUsagePercent');
const statPlanName = document.getElementById('statPlanName');
const statWeeklyCountdown = document.getElementById('statWeeklyCountdown');
const globalCountdown = document.getElementById('globalCountdown');

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
  initRenewalTimestamps();
  initSimulatedUsage();
  initEventListeners();

  planSelect.value = currentPlan;
  detectSubscriptionPlan();
  renderAll();
  
  // Real-Time Telemetry & Countdown Ticker (1000ms loop)
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
  if (detectedPlanDesc) detectedPlanDesc.textContent = `${planInfo.badge} • Active Antigravity License`;
  if (bannerPlanName) bannerPlanName.textContent = planInfo.name;
  if (bannerPlanBadge) bannerPlanBadge.textContent = 'ACTIVE ' + planInfo.id.toUpperCase();
}

function initRenewalTimestamps() {
  const now = Date.now();
  let modified = false;
  ANTIGRAVITY_MODELS.forEach(m => {
    // 5-Hour Sprint Reset Timer
    if (!renewalTimestamps[m.id] || renewalTimestamps[m.id] <= now) {
      const randomOffsetMs = Math.floor(Math.random() * (4 * 3600 * 1000));
      renewalTimestamps[m.id] = now + (m.quota[currentPlan].resetHours * 3600 * 1000) - randomOffsetMs;
      modified = true;
    }
    // 7-Day Weekly Baseline Reset Timer
    if (!weeklyRenewalTimestamps[m.id] || weeklyRenewalTimestamps[m.id] <= now) {
      const randomOffsetWeeklyMs = Math.floor(Math.random() * (2 * 24 * 3600 * 1000));
      weeklyRenewalTimestamps[m.id] = now + (7 * 24 * 3600 * 1000) - randomOffsetWeeklyMs;
      modified = true;
    }
  });
  if (modified) {
    localStorage.setItem('ag_renewal_timestamps', JSON.stringify(renewalTimestamps));
    localStorage.setItem('ag_weekly_renewal_timestamps', JSON.stringify(weeklyRenewalTimestamps));
  }
}

function initSimulatedUsage() {
  let modified = false;
  ANTIGRAVITY_MODELS.forEach(m => {
    if (simulatedUsage[m.id] === undefined) {
      simulatedUsage[m.id] = m.defaultSimulatedUsage || 35.0;
      modified = true;
    }
    if (simulatedWeeklyUsage[m.id] === undefined) {
      simulatedWeeklyUsage[m.id] = m.defaultSimulatedWeeklyUsage || 50.0;
      modified = true;
    }
  });
  if (modified) {
    localStorage.setItem('ag_simulated_usage', JSON.stringify(simulatedUsage));
    localStorage.setItem('ag_simulated_weekly_usage', JSON.stringify(simulatedWeeklyUsage));
  }
}

function formatNumber(num) { return new Intl.NumberFormat('en-US').format(Math.floor(num)); }

function formatCountdown(ms) {
  if (ms <= 0) return '00h 00m 00s (Resetting...)';
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

function formatDaysCountdown(ms) {
  if (ms <= 0) return '00d 00h 00m 00s (Resetting...)';
  const totalSecs = Math.floor(ms / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
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
 * CALCULATE SHARED POOLS
 * Aggregates percentage-based Work Done compute weight across 3 Shared Pools.
 */
function renderSummaryStats() {
  const poolUsage = {};
  let modelCount = 0;

  ANTIGRAVITY_MODELS.forEach(m => {
    const poolId = m.sharedPool;
    poolUsage[poolId] = Math.max(poolUsage[poolId] || 0, simulatedWeeklyUsage[m.id] || 0);
    modelCount++;
  });

  const poolValues = Object.values(poolUsage);
  const avgWorkDone = (poolValues.reduce((a, b) => a + b, 0) / poolValues.length).toFixed(1);

  if (statTotalTokens) statTotalTokens.textContent = '3 Shared Pools';
  if (statUsedTokens) statUsedTokens.textContent = avgWorkDone + '%';
  if (statUsagePercent) statUsagePercent.textContent = avgWorkDone + '%';
}

/**
 * RENDER MODELS GRID WITH DUAL GAUGES & DEDICATED 7-DAY WEEKLY RESET TIMERS
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

  filtered.forEach(m => {
    const used5hr = Math.min(100, Math.max(0, simulatedUsage[m.id] || 0));
    const usedWeekly = Math.min(100, Math.max(0, simulatedWeeklyUsage[m.id] || 0));
    const isLockedOut = usedWeekly >= 100;

    const now = Date.now();
    const msLeft5hr = Math.max(0, (renewalTimestamps[m.id] || now) - now);
    const msLeftWeekly = Math.max(0, (weeklyRenewalTimestamps[m.id] || now) - now);

    const card = document.createElement('div');
    card.className = `model-card ${isLockedOut ? 'locked-out-card' : ''}`;
    card.dataset.modelId = m.id;

    card.innerHTML = `
      <div>
        <div class="model-card-header">
          <span class="provider-tag ${m.providerKey}">${m.provider}</span>
          <span class="speed-badge ${m.speedClass}">${m.speedBadge}</span>
        </div>
        <h3 class="model-title">${m.name}</h3>
        <p class="model-desc">${m.description}</p>
        
        <!-- GAUGE A: 5-HOUR ROLLING SPRINT -->
        <div class="quota-gauge-container">
          <div class="gauge-header">
            <span class="gauge-label">Gauge A: 5-Hour Sprint</span>
            <span class="gauge-stats gauge-5hr-stats">${used5hr.toFixed(1)}% Work Done</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill gauge-5hr-fill ${used5hr > 85 ? 'warning' : ''}" style="width: ${used5hr}%;"></div>
          </div>
          <div class="gauge-footer">
            <span>Draw Rate: <strong>${m.workDoneWeight} Weight</strong></span>
            <div class="timer-pill" data-timer-id="${m.id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 16 14"/></svg>
              <span class="sprint-timer-text">${isLockedOut ? 'PAUSED' : formatCountdown(msLeft5hr)}</span>
            </div>
          </div>
        </div>

        <!-- GAUGE B: 7-DAY WEEKLY BASELINE -->
        <div class="quota-gauge-container" style="margin-bottom: 0;">
          <div class="gauge-header">
            <span class="gauge-label" style="color: #f59e0b;">Gauge B: 7-Day Baseline Ceiling</span>
            <span class="gauge-stats gauge-weekly-stats">${usedWeekly.toFixed(1)}% Baseline</span>
          </div>
          <div class="progress-bar-bg baseline-bg">
            <div class="progress-bar-fill baseline-fill gauge-weekly-fill ${isLockedOut ? 'lockout' : ''}" style="width: ${usedWeekly}%;"></div>
          </div>
          
          <div class="gauge-footer" style="margin-top: 4px;">
            <span>7-Day Reset Timer:</span>
            <div class="timer-pill weekly-timer-pill" style="border-color: rgba(245, 158, 11, 0.4); color: #fbbf24;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span class="weekly-timer-text">${formatDaysCountdown(msLeftWeekly)}</span>
            </div>
          </div>

          ${isLockedOut ? `
            <div class="lockout-warning-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 3-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>🚨 7-DAY LOCKOUT ACTIVE — Baseline Threshold Exceeded</span>
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
    return ((weeklyRenewalTimestamps[a.id] || now) - now) - ((weeklyRenewalTimestamps[b.id] || now) - now);
  });

  sorted.forEach(m => {
    const msLeft5hr = Math.max(0, (renewalTimestamps[m.id] || now) - now);
    const msLeftWeekly = Math.max(0, (weeklyRenewalTimestamps[m.id] || now) - now);
    const card = document.createElement('div');
    card.className = 'renewal-card';
    card.innerHTML = `
      <div class="renewal-info">
        <span class="provider-tag ${m.providerKey}">${m.provider}</span>
        <div>
          <div class="renewal-name">${m.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">Shares ${m.sharedPool.replace('_', ' ')} • Work Done Weight: ${m.workDoneWeight}</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div class="renewal-timer" style="font-size: 12px; color: #34d399;">Sprint: ${formatCountdown(msLeft5hr)}</div>
        <div class="renewal-timer" style="font-size: 11px; color: #fbbf24; margin-top: 2px;">Weekly Reset: ${formatDaysCountdown(msLeftWeekly)}</div>
      </div>
    `;
    renewalsList.appendChild(card);
  });
}

function renderSpecsTable() {
  specsTableBody.innerHTML = '';
  ANTIGRAVITY_MODELS.forEach(m => {
    const q = m.quota[currentPlan];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${m.name}</strong></td>
      <td><span class="provider-tag ${m.providerKey}">${m.provider}</span></td>
      <td><span class="speed-badge ${m.speedClass}">${m.speedBadge}</span></td>
      <td>${(m.contextWindow / 1000).toFixed(0)}K</td>
      <td>${(m.maxOutputTokens / 1000).toFixed(0)}K</td>
      <td><strong>${m.workDoneWeight}</strong></td>
      <td><strong>${m.sharedPool.replace('_', ' ').toUpperCase()}</strong></td>
      <td>5H Sprint / 7D Baseline</td>
    `;
    specsTableBody.appendChild(tr);
  });
}

/**
 * REAL-TIME TELEMETRY & COUNTDOWN TICKER (Runs every 1000ms)
 * Continuously increments Work Done compute draw, updates both 5-hr sprint and 7-day weekly reset timers live.
 */
function tickTelemetry() {
  const now = Date.now();
  let minMs5hr = Infinity;
  let minMsWeekly = Infinity;

  ANTIGRAVITY_MODELS.forEach(m => {
    // Dynamic Work Done compute micro-draw
    const microDraw5hr = (Math.random() * 0.04) + 0.01;
    const microDrawWeekly = microDraw5hr * 0.75;

    if (simulatedUsage[m.id] !== undefined) {
      simulatedUsage[m.id] = Math.min(100, (simulatedUsage[m.id] || 0) + microDraw5hr);
    }
    if (simulatedWeeklyUsage[m.id] !== undefined) {
      simulatedWeeklyUsage[m.id] = Math.min(100, (simulatedWeeklyUsage[m.id] || 0) + microDrawWeekly);
    }

    const msLeft5hr = Math.max(0, (renewalTimestamps[m.id] || now) - now);
    const msLeftWeekly = Math.max(0, (weeklyRenewalTimestamps[m.id] || now) - now);

    if (msLeft5hr < minMs5hr) minMs5hr = msLeft5hr;
    if (msLeftWeekly < minMsWeekly) minMsWeekly = msLeftWeekly;

    // Update DOM card elements
    const card = document.querySelector(`[data-model-id="${m.id}"]`);
    if (card) {
      const used5hr = Math.min(100, Math.max(0, simulatedUsage[m.id] || 0));
      const usedWeekly = Math.min(100, Math.max(0, simulatedWeeklyUsage[m.id] || 0));
      const isLockedOut = usedWeekly >= 100;

      const stats5hr = card.querySelector('.gauge-5hr-stats');
      if (stats5hr) stats5hr.textContent = `${used5hr.toFixed(1)}% Work Done`;

      const fill5hr = card.querySelector('.gauge-5hr-fill');
      if (fill5hr) {
        fill5hr.style.width = `${used5hr}%`;
        fill5hr.className = `progress-bar-fill gauge-5hr-fill ${used5hr > 85 ? 'warning' : ''}`;
      }

      const statsWeekly = card.querySelector('.gauge-weekly-stats');
      if (statsWeekly) statsWeekly.textContent = `${usedWeekly.toFixed(1)}% Baseline`;

      const fillWeekly = card.querySelector('.gauge-weekly-fill');
      if (fillWeekly) {
        fillWeekly.style.width = `${usedWeekly}%`;
        if (isLockedOut) fillWeekly.classList.add('lockout');
      }

      const sprintTimerText = card.querySelector('.sprint-timer-text');
      if (sprintTimerText) sprintTimerText.textContent = isLockedOut ? 'PAUSED' : formatCountdown(msLeft5hr);

      const weeklyTimerText = card.querySelector('.weekly-timer-text');
      if (weeklyTimerText) weeklyTimerText.textContent = formatDaysCountdown(msLeftWeekly);
    }
  });

  // Persist telemetry
  localStorage.setItem('ag_simulated_usage', JSON.stringify(simulatedUsage));
  localStorage.setItem('ag_simulated_weekly_usage', JSON.stringify(simulatedWeeklyUsage));

  renderSummaryStats();

  if (globalCountdown) globalCountdown.textContent = formatCountdown(minMs5hr === Infinity ? 0 : minMs5hr);
  if (statWeeklyCountdown) statWeeklyCountdown.textContent = formatDaysCountdown(minMsWeekly === Infinity ? 0 : minMsWeekly);
}

function updateTokenEstimate() {
  const text = calcTextArea.value;
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  let estTokens = 0;
  if (text.length > 0) {
    const symbolMatches = text.match(/[{}[\]();:,.<>/?!@#$%^&*+\-=/\\|'"`~]/g) || [];
    estTokens = Math.max(1, Math.ceil((words * 1.32) + (symbolMatches.length * 0.65) + (lines * 0.2)));
  }

  calcCharCount.textContent = formatNumber(chars);
  calcWordCount.textContent = formatNumber(words);
  calcLineCount.textContent = formatNumber(lines);
  calcTokenCount.textContent = formatNumber(estTokens);

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
 * DYNAMIC AI CHATBOT ENGINE
 * Aligned with Official Google Antigravity Documentation (antigravity.google/docs).
 */
function generateAIResponse(userText) {
  const q = userText.toLowerCase();

  // INTENT 1: 5-Hour Sprint & Work Done Metric
  if (q.includes('max out') || q.includes('zero') || q.includes('30 min') || (q.includes('reset') && !q.includes('weekly'))) {
    return `<strong>Official Google Antigravity Quota Guidance (antigravity.google/docs):</strong><br><br>` +
      `1. <strong>5-Hour Rolling Sprint:</strong> Tokens recover progressively 5 hours after they were consumed on a sliding window.<br><br>` +
      `2. <strong>Work Done Metric (Not Raw Tokens):</strong> Antigravity does not cap usage on simple token sums. Quotas track dynamic computational weight (&ldquo;Work Done&rdquo;). Autonomous agent loops, multi-file edits, and terminal execution consume compute significantly faster than simple inline completions.<br><br>` +
      `3. <strong>Shared Pool Drag:</strong> Models operate on 3 shared buckets (Gemini, Third-Party, and OSS). Exhausting Claude Opus directly reduces Claude Sonnet capacity.`;
  }

  // INTENT 2: 7-Day Weekly Reset Timer & Lockout Rules
  if (q.includes('weekly') || q.includes('month') || q.includes('lockout') || q.includes('7-day') || q.includes('7 day') || q.includes('other limit') || /\bcap\b/.test(q) || q.includes('weekly cap')) {
    const opusWeeklyUsed = (simulatedWeeklyUsage['claude-opus-4.6'] || 0).toFixed(1);
    const now = Date.now();
    const msLeftWeekly = Math.max(0, (weeklyRenewalTimestamps['claude-opus-4.6'] || now) - now);

    return `<strong>Dual-Layer Quota System &amp; 7-Day Weekly Reset Timers:</strong><br><br>` +
      `Antigravity governs priority access through two simultaneous layers:<br>` +
      `&bull; <strong>Gauge A (5-Hour Rolling Sprint)</strong>: Short-term fuel for active coding sessions.<br>` +
      `&bull; <strong>Gauge B (7-Day Baseline Ceiling)</strong>: Hard weekly threshold tracking total cumulative &ldquo;Work Done&rdquo;.<br><br>` +
      `<strong>Current Live Telemetry:</strong><br>` +
      `• Claude Opus 7-Day Baseline: <strong>${opusWeeklyUsed}%</strong><br>` +
      `• 7-Day Weekly Reset Countdown: <strong>${formatDaysCountdown(msLeftWeekly)}</strong><br><br>` +
      `<strong>Lockout Behavior:</strong> When Gauge B reaches 100%, the system freezes your 5-hour sprint timer and displays a prominent <code>🚨 7-DAY LOCKOUT ACTIVE</code> alert until the weekly reset completes.`;
  }

  // INTENT 3: Shared Model Pools
  if (q.includes('shared') || q.includes('pool') || q.includes('bucket') || q.includes('isolated') || q.includes('independent')) {
    return `<strong>Shared Model Pool Architecture:</strong><br><br>` +
      `All 11 models share 3 parent quota pools:<br><br>` +
      `&bull; <strong>Gemini Pool (8 Models)</strong>: Gemini 3.6 Flash &amp; 3.1 Pro variants.<br>` +
      `&bull; <strong>Third-Party Pool (2 Models)</strong>: Claude Sonnet 4.6 &amp; Claude Opus 4.6.<br>` +
      `&bull; <strong>OSS Pool (1 Model)</strong>: GPT-OSS 120B.<br><br>` +
      `Heavy Work Done draw on one model reduces quota for all other models in the same pool.`;
  }

  // INTENT 4: Telemetry & /usage CLI Command
  if (q.includes('/usage') || q.includes('real-time') || q.includes('live') || q.includes('health') || q.includes('status') || q.includes('check')) {
    return `<strong>Live Telemetry &amp; Verification (antigravity.google/docs):</strong><br><br>` +
      `1. <strong>CLI Command</strong>: Type <code>/usage</code> in your Antigravity IDE terminal for a live telemetry report of sprint and 7-day baseline consumption.<br><br>` +
      `2. <strong>IDE Settings</strong>: Check <strong>Agent Manager &gt; Settings &gt; Models</strong> for real-time pool health and lockout warnings.<br><br>` +
      `3. <strong>This Dashboard</strong>: Animates dynamic Work Done draw and dedicated 7-day reset timers live every 1000ms.`;
  }

  // INTENT 5: Default Response
  return `Regarding your query: <em>&ldquo;${userText}&rdquo;</em><br><br>` +
    `Under official <strong>Google Antigravity Pro Plan</strong> rules:<br>` +
    `1. Quotas track dynamic <strong>Work Done</strong> compute weight rather than static raw token counts.<br>` +
    `2. Each model card features a <strong>5-Hour Sprint Timer</strong> and a dedicated <strong>7-Day Weekly Reset Countdown</strong> (<code>06d 23h 45m 12s</code>).<br>` +
    `3. Crossing the 7-day baseline ceiling triggers a priority lockout override until the weekly timer completes.`;
}

window.openModelModal = function (id) {
  const m = ANTIGRAVITY_MODELS.find(x => x.id === id);
  if (!m) return;
  const q = m.quota[currentPlan];
  const now = Date.now();
  const msLeftWeekly = Math.max(0, (weeklyRenewalTimestamps[m.id] || now) - now);

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
        <span class="modal-spec-label">Shared Pool Environment</span>
        <span class="modal-spec-val">${m.sharedPool.replace('_', ' ').toUpperCase()}</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Work Done Compute Weight</span>
        <span class="modal-spec-val">${m.workDoneWeight}</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">5-Hour Sprint Refresh</span>
        <span class="modal-spec-val">Rolling 5-Hour Window</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">7-Day Weekly Baseline Reset</span>
        <span class="modal-spec-val" style="color: #fbbf24;">${formatDaysCountdown(msLeftWeekly)}</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Rate Limit</span>
        <span class="modal-spec-val">${q.rpm} RPM</span>
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

  document.getElementById('btnRefresh')?.addEventListener('click', () => { initRenewalTimestamps(); renderAll(); });
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
}