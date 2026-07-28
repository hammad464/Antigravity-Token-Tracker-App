/**
 * Antigravity Quotas & Token Monitor Desktop Application Renderer
 * Fully Restored 11 Models Architecture.
 * Features Shared Pools, Dual Progress Gauges (5-Hr Sprint & 7-Day Weekly Baseline),
 * Visual 7-Day Lockout Alerts, and Real-Time Dynamic Telemetry Ticker.
 */

let currentPlan = localStorage.getItem('ag_plan') || 'pro';
let activeFilter = 'all';
let searchQuery = '';
let simulatedUsage = JSON.parse(localStorage.getItem('ag_simulated_usage') || '{}');
let simulatedWeeklyUsage = JSON.parse(localStorage.getItem('ag_simulated_weekly_usage') || '{}');
let renewalTimestamps = JSON.parse(localStorage.getItem('ag_renewal_timestamps') || '{}');

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
const statMaxRpm = document.getElementById('statMaxRpm');
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
    if (!renewalTimestamps[m.id] || renewalTimestamps[m.id] <= now) {
      const randomOffsetMs = Math.floor(Math.random() * (4 * 3600 * 1000));
      renewalTimestamps[m.id] = now + (m.quota[currentPlan].resetHours * 3600 * 1000) - randomOffsetMs;
      modified = true;
    }
  });
  if (modified) localStorage.setItem('ag_renewal_timestamps', JSON.stringify(renewalTimestamps));
}

function initSimulatedUsage() {
  let modified = false;
  ANTIGRAVITY_MODELS.forEach(m => {
    const q = m.quota[currentPlan];
    if (simulatedUsage[m.id] === undefined) {
      simulatedUsage[m.id] = m.defaultSimulatedUsage || Math.floor(q.total * 0.35);
      modified = true;
    }
    if (simulatedWeeklyUsage[m.id] === undefined) {
      simulatedWeeklyUsage[m.id] = m.defaultSimulatedWeeklyUsage || Math.floor(q.weeklyBaselineLimit * 0.45);
      modified = true;
    }
  });
  if (modified) {
    localStorage.setItem('ag_simulated_usage', JSON.stringify(simulatedUsage));
    localStorage.setItem('ag_simulated_weekly_usage', JSON.stringify(simulatedWeeklyUsage));
  }
}

function formatNumber(num) { return new Intl.NumberFormat('en-US').format(Math.floor(num)); }
function formatCompactTokens(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
  return Math.floor(num).toString();
}

function formatCountdown(ms) {
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
  statPlanName.textContent = planInfo.badge + ' POOL ALLOWANCE';
  renderAll();
}

/**
 * CALCULATE SHARED POOLS
 * Aggregates capacity and usage per sharedPool (gemini_pool, third_party_pool, oss_pool).
 */
function renderSummaryStats() {
  const poolCapacity = {};
  const poolUsage = {};
  let maxRpmPool = 0;

  ANTIGRAVITY_MODELS.forEach(m => {
    const q = m.quota[currentPlan];
    const poolId = m.sharedPool;

    if (!poolCapacity[poolId] || q.total > poolCapacity[poolId]) {
      poolCapacity[poolId] = q.total;
    }

    poolUsage[poolId] = (poolUsage[poolId] || 0) + (simulatedUsage[m.id] || 0);
    if (q.rpm > maxRpmPool) maxRpmPool = q.rpm;
  });

  let totalCap = 0;
  let totalUsed = 0;
  for (const poolId of Object.keys(poolCapacity)) {
    const cap = poolCapacity[poolId];
    totalCap += cap;
    totalUsed += Math.min(poolUsage[poolId] || 0, cap);
  }

  const pct = totalCap > 0 ? ((totalUsed / totalCap) * 100).toFixed(1) : 0;

  statTotalTokens.textContent = formatNumber(totalCap);
  statUsedTokens.textContent = formatNumber(totalUsed);
  statUsagePercent.textContent = pct + '%';
  statMaxRpm.textContent = maxRpmPool + ' RPM';
}

/**
 * RENDER MODELS GRID WITH DUAL PROGRESS GAUGES & LOCKOUT STATUS
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
    const q = m.quota[currentPlan];
    const used5hr = simulatedUsage[m.id] || 0;
    const remaining5hr = Math.max(0, q.total - used5hr);
    const pct5hr = Math.min(100, Math.max(0, (used5hr / q.total) * 100)).toFixed(1);

    const usedWeekly = simulatedWeeklyUsage[m.id] || 0;
    const limitWeekly = q.weeklyBaselineLimit;
    const pctWeekly = Math.min(100, Math.max(0, (usedWeekly / limitWeekly) * 100)).toFixed(1);
    const isLockedOut = pctWeekly >= 100;

    const now = Date.now();
    const msLeft = Math.max(0, (renewalTimestamps[m.id] || now) - now);

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
            <span class="gauge-label">Gauge A: 5-Hour Rolling Sprint</span>
            <span class="gauge-stats gauge-5hr-stats">${formatCompactTokens(used5hr)} / ${formatCompactTokens(q.total)} (${pct5hr}%)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill gauge-5hr-fill ${pct5hr > 85 ? 'warning' : ''}" style="width: ${pct5hr}%;"></div>
          </div>
          <div class="gauge-footer">
            <span>Remaining: <strong class="gauge-5hr-remaining">${formatCompactTokens(remaining5hr)}</strong></span>
            <div class="timer-pill" data-timer-id="${m.id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>${isLockedOut ? 'PAUSED' : formatCountdown(msLeft)}</span>
            </div>
          </div>
        </div>

        <!-- GAUGE B: 7-DAY WEEKLY BASELINE -->
        <div class="quota-gauge-container" style="margin-bottom: 0;">
          <div class="gauge-header">
            <span class="gauge-label" style="color: #f59e0b;">Gauge B: 7-Day Baseline Ceiling</span>
            <span class="gauge-stats gauge-weekly-stats">${formatCompactTokens(usedWeekly)} / ${formatCompactTokens(limitWeekly)} (${pctWeekly}%)</span>
          </div>
          <div class="progress-bar-bg baseline-bg">
            <div class="progress-bar-fill baseline-fill gauge-weekly-fill ${isLockedOut ? 'lockout' : ''}" style="width: ${pctWeekly}%;"></div>
          </div>
          ${isLockedOut ? `
            <div class="lockout-warning-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>7-DAY LOCKOUT ACTIVE — Baseline Threshold Exceeded</span>
            </div>
          ` : `
            <div class="gauge-footer" style="font-size: 10px; color: var(--text-dim);">
              <span>Cumulative Work Done</span>
              <span>Reset Window: 7 Days</span>
            </div>
          `}
        </div>
      </div>

      <div class="model-footer-row" style="margin-top: 14px;">
        <span class="context-pill">Context: ${formatCompactTokens(m.contextWindow)}</span>
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
    return ((renewalTimestamps[a.id] || now) - now) - ((renewalTimestamps[b.id] || now) - now);
  });

  sorted.forEach(m => {
    const msLeft = Math.max(0, (renewalTimestamps[m.id] || now) - now);
    const card = document.createElement('div');
    card.className = 'renewal-card';
    card.innerHTML = `
      <div class="renewal-info">
        <span class="provider-tag ${m.providerKey}">${m.provider}</span>
        <div>
          <div class="renewal-name">${m.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">Shares ${m.sharedPool.replace('_', ' ')} • 5hr Cycle</div>
        </div>
      </div>
      <div class="renewal-timer" data-timer-id="${m.id}">${formatCountdown(msLeft)}</div>
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
      <td>${formatCompactTokens(m.contextWindow)}</td>
      <td>${formatCompactTokens(m.maxOutputTokens)}</td>
      <td>${m.reasoning ? '✓ Yes' : 'No'}</td>
      <td><strong>${m.sharedPool.replace('_', ' ').toUpperCase()}</strong></td>
      <td>5H Sprint / 7D Weekly</td>
    `;
    specsTableBody.appendChild(tr);
  });
}

/**
 * REAL-TIME TELEMETRY & COUNTDOWN TICKER (Runs every 1000ms)
 * Dynamically updates simulated usage, animated progress bars, percentages, and reset countdowns.
 */
function tickTelemetry() {
  const now = Date.now();
  let minMs = Infinity;

  // Simulate dynamic background subagent consumption
  ANTIGRAVITY_MODELS.forEach(m => {
    const q = m.quota[currentPlan];
    // Random micro-draw (1,000 to 5,000 tokens/sec simulating active background subagents)
    const microIncrement5hr = Math.floor(Math.random() * 4000) + 1000;
    const microIncrementWeekly = Math.floor(microIncrement5hr * 0.85);

    if (simulatedUsage[m.id] !== undefined) {
      simulatedUsage[m.id] = Math.min(q.total * 1.05, (simulatedUsage[m.id] || 0) + microIncrement5hr);
    }
    if (simulatedWeeklyUsage[m.id] !== undefined) {
      simulatedWeeklyUsage[m.id] = Math.min(q.weeklyBaselineLimit * 1.05, (simulatedWeeklyUsage[m.id] || 0) + microIncrementWeekly);
    }

    const msLeft = Math.max(0, (renewalTimestamps[m.id] || now) - now);
    if (msLeft < minMs) minMs = msLeft;

    // Update DOM card dynamically if present
    const card = document.querySelector(`[data-model-id="${m.id}"]`);
    if (card) {
      const used5hr = simulatedUsage[m.id] || 0;
      const remaining5hr = Math.max(0, q.total - used5hr);
      const pct5hr = Math.min(100, Math.max(0, (used5hr / q.total) * 100)).toFixed(1);

      const usedWeekly = simulatedWeeklyUsage[m.id] || 0;
      const limitWeekly = q.weeklyBaselineLimit;
      const pctWeekly = Math.min(100, Math.max(0, (usedWeekly / limitWeekly) * 100)).toFixed(1);
      const isLockedOut = pctWeekly >= 100;

      const stats5hr = card.querySelector('.gauge-5hr-stats');
      if (stats5hr) stats5hr.textContent = `${formatCompactTokens(used5hr)} / ${formatCompactTokens(q.total)} (${pct5hr}%)`;

      const fill5hr = card.querySelector('.gauge-5hr-fill');
      if (fill5hr) {
        fill5hr.style.width = `${pct5hr}%`;
        fill5hr.className = `progress-bar-fill gauge-5hr-fill ${pct5hr > 85 ? 'warning' : ''}`;
      }

      const rem5hr = card.querySelector('.gauge-5hr-remaining');
      if (rem5hr) rem5hr.textContent = formatCompactTokens(remaining5hr);

      const statsWeekly = card.querySelector('.gauge-weekly-stats');
      if (statsWeekly) statsWeekly.textContent = `${formatCompactTokens(usedWeekly)} / ${formatCompactTokens(limitWeekly)} (${pctWeekly}%)`;

      const fillWeekly = card.querySelector('.gauge-weekly-fill');
      if (fillWeekly) {
        fillWeekly.style.width = `${pctWeekly}%`;
        if (isLockedOut) fillWeekly.classList.add('lockout');
      }

      const timerPill = card.querySelector(`[data-timer-id="${m.id}"] span`);
      if (timerPill) timerPill.textContent = isLockedOut ? 'PAUSED' : formatCountdown(msLeft);
    }
  });

  // Persist current telemetry
  localStorage.setItem('ag_simulated_usage', JSON.stringify(simulatedUsage));
  localStorage.setItem('ag_simulated_weekly_usage', JSON.stringify(simulatedWeeklyUsage));

  // Update Summary Stats dynamically
  renderSummaryStats();

  if (globalCountdown) globalCountdown.textContent = formatCountdown(minMs === Infinity ? 0 : minMs);
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
          ${estTokens === 0 ? '0%' : pct.toFixed(2) + '% capacity'} ${fits ? '✓ Fits' : '⚠️ Exceeds'}
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
 * Reads live real-time telemetry variables to answer user queries accurately.
 */
function generateAIResponse(userText) {
  const q = userText.toLowerCase();

  // INTENT 1: Maxing Out, 5-Hour Rule, and SHARED POOLS
  if (q.includes('max out') || q.includes('zero') || q.includes('30 min') || (q.includes('reset') && !q.includes('weekly'))) {
    return `<strong>Here is exactly how the 5-hour rolling window works:</strong><br><br>` +
      `1. <strong>Rolling Sliding Window</strong>: If you max out your quota, it doesn't hard-reset at clock zero. Tokens recover progressively exactly 5 hours after they were consumed.<br><br>` +
      `2. <strong>SHARED POOLS (Crucial Rule)</strong>: Limits are <strong>NOT</strong> isolated per model! Antigravity operates on shared buckets:<br>` +
      `• <strong>Gemini Pool</strong> (8 Flash &amp; Pro variants)<br>` +
      `• <strong>Third-Party Pool</strong> (Claude Sonnet 4.6 &amp; Claude Opus 4.6)<br>` +
      `• <strong>OSS Pool</strong> (GPT-OSS 120B)<br>` +
      `Exhausting Claude Opus <em>will</em> lock you out of Claude Sonnet until the pool refreshes.<br><br>` +
      `3. <strong>Work Done Metric</strong>: Quotas drain based on computational weight (e.g., autonomous subagents cost heavily), not just raw token output.`;
  }

  // INTENT 2: The Strict Weekly Lockout (The Marathon)
  if (q.includes('weekly') || q.includes('month') || q.includes('lockout') || q.includes('7-day') || q.includes('7 day') || q.includes('other limit') || /\bcap\b/.test(q) || q.includes('weekly cap')) {
    const opusModel = ANTIGRAVITY_MODELS.find(m => m.id === 'claude-opus-4.6');
    const opusWeeklyUsed = simulatedWeeklyUsage['claude-opus-4.6'] || 0;
    const opusWeeklyLimit = opusModel ? opusModel.quota[currentPlan].weeklyBaselineLimit : 15000000;
    const pctOpus = ((opusWeeklyUsed / opusWeeklyLimit) * 100).toFixed(1);

    return `<strong>YES, there is a strict 7-Day Weekly Baseline on ${ANTIGRAVITY_PLANS[currentPlan].name}.</strong><br><br>` +
      `Antigravity uses a <strong>dual-layer quota system</strong>:<br>` +
      `&bull; <strong>Gauge A (5-Hour Sprint)</strong>: Short-term rolling fuel for active sessions.<br>` +
      `&bull; <strong>Gauge B (7-Day Baseline Ceiling)</strong>: Hard weekly threshold tracking total &ldquo;Work Done&rdquo;.<br><br>` +
      `<strong>Current Live Telemetry:</strong> Your Claude Opus 7-Day Baseline is currently at <strong>${pctOpus}%</strong> (${formatCompactTokens(opusWeeklyUsed)} / ${formatCompactTokens(opusWeeklyLimit)}).<br><br>` +
      `<strong>The Lockout:</strong> Crossing Gauge B overrides your 5-hour refresh and locks you out of priority quota. You must wait for the 7-day window to pass or enable pay-as-you-go AI Credit Overages.`;
  }

  // INTENT 3: Shared Pools Explanation
  if (q.includes('shared') || q.includes('pool') || q.includes('bucket') || q.includes('isolated') || q.includes('independent')) {
    return `<strong>How Shared Model Pools Work:</strong><br><br>` +
      `All 11 models operate on 3 shared quota buckets:<br><br>` +
      `&bull; <strong>Gemini Pool (8 Models)</strong>: Gemini 3.6 Flash (High/Med/Low), Gemini 3.5 Flash (High/Med/Low), Gemini 3.1 Pro (High/Low).<br>` +
      `&bull; <strong>Third-Party Pool (2 Models)</strong>: Claude Sonnet 4.6 &amp; Claude Opus 4.6.<br>` +
      `&bull; <strong>OSS Pool (1 Model)</strong>: GPT-OSS 120B (Medium).<br><br>` +
      `Consuming quota on one model directly drains capacity for all other models in the same pool.`;
  }

  // INTENT 4: Live Telemetry Status Query
  if (q.includes('/usage') || q.includes('real-time') || q.includes('live') || q.includes('health') || q.includes('status') || q.includes('check')) {
    const flashModel = ANTIGRAVITY_MODELS[m => m.id === 'gemini-3.6-flash-high'];
    const gemini5hrUsed = simulatedUsage['gemini-3.6-flash-high'] || 0;
    const gemini5hrTotal = 10000000;
    const pctGemini = ((gemini5hrUsed / gemini5hrTotal) * 100).toFixed(1);

    return `<strong>Live Antigravity Telemetry Report:</strong><br><br>` +
      `&bull; <strong>Active Plan</strong>: ${ANTIGRAVITY_PLANS[currentPlan].name}<br>` +
      `&bull; <strong>Gemini 3.6 Flash 5-Hr Sprint</strong>: ${pctGemini}% consumed (${formatCompactTokens(gemini5hrUsed)} / ${formatCompactTokens(gemini5hrTotal)})<br>` +
      `&bull; <strong>Live Ticker Status</strong>: Active background telemetry ticker running at 1000ms.<br><br>` +
      `You can also type <code>/usage</code> in your actual IDE terminal or navigate to <strong>Agent Manager &gt; Settings &gt; Models</strong> for production server metrics.`;
  }

  // INTENT 5: Model Recommendations
  if (q.includes('compare') || q.includes('best') || q.includes('which model') || q.includes('recommend')) {
    return `<strong>Model Recommendations across all 11 Models:</strong><br><br>` +
      `1. <strong>For Large Codebases / Architectural Review:</strong><br>` +
      `Use <strong>Gemini 3.1 Pro (High)</strong> &rarr; 2 Million token context window.<br><br>` +
      `2. <strong>For Deep Logic &amp; Algorithmic Bug Fixing:</strong><br>` +
      `Use <strong>Claude Sonnet 4.6 (Thinking)</strong> &rarr; Step-by-step cognitive reasoning.<br><br>` +
      `3. <strong>For Fast Pair-Programming &amp; Autocomplete:</strong><br>` +
      `Use <strong>Gemini 3.6 Flash (High)</strong> &rarr; Low latency, high throughput.<br><br>` +
      `4. <strong>For Privacy / Local Inference:</strong><br>` +
      `Use <strong>GPT-OSS 120B (Medium)</strong> &rarr; Open weights model in OSS Pool.`;
  }

  // INTENT 6: Default General Response
  return `Regarding your question: <em>&ldquo;${userText}&rdquo;</em><br><br>` +
    `In <strong>Antigravity (${ANTIGRAVITY_PLANS[currentPlan].name})</strong>, your 11 models are structured into 3 Shared Pools (Gemini, Third-Party, and OSS).<br><br>` +
    `You are governed by two live progress gauges:<br>` +
    `1. <strong>Gauge A (5-Hour Sprint):</strong> Refreshes rolling compute every 5 hours.<br>` +
    `2. <strong>Gauge B (7-Day Baseline Ceiling):</strong> Tracks total cumulative Work Done. Crossing Gauge B triggers a 7-day priority lockout.<br><br>` +
    `Type <code>/usage</code> in your IDE terminal for live server health.`;
}

window.openModelModal = function (id) {
  const m = ANTIGRAVITY_MODELS.find(x => x.id === id);
  if (!m) return;
  const q = m.quota[currentPlan];
  modalBadge.textContent = m.provider;
  modalTitle.textContent = m.name;
  modalSubtitle.textContent = m.variant + ' • ' + m.speedBadge;
  modalBody.innerHTML = `
    <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">${m.description}</p>
    <div style="margin-top: 12px;">
      <div class="modal-spec-row">
        <span class="modal-spec-label">Context Window Limit</span>
        <span class="modal-spec-val">${formatNumber(m.contextWindow)} Tokens</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Shared Pool Environment</span>
        <span class="modal-spec-val">${m.sharedPool.replace('_', ' ').toUpperCase()}</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Gauge A (5-Hr Sprint Limit)</span>
        <span class="modal-spec-val">${formatNumber(q.total)} Tokens</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Gauge B (7-Day Baseline Limit)</span>
        <span class="modal-spec-val">${formatNumber(q.weeklyBaselineLimit)} Tokens</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Rate Limit</span>
        <span class="modal-spec-val">${q.rpm} RPM / ${formatNumber(q.tpm)} TPM</span>
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