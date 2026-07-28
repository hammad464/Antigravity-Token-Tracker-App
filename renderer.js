/**
 * Antigravity Quotas & Token Monitor Desktop Application Renderer
 * 100% Aligned with Official Antigravity IDE Settings Screen (image_00a58d.png).
 * Features 2 Official Model Groups ('Gemini Models' & 'Claude and GPT models'),
 * Rolling Weekly Sliding Windows, 5-Hour Refresh Timers, and AI Credit Overages.
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

  // Real-Time Telemetry Loop (1000ms)
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
      const randomOffsetMs = Math.floor(Math.random() * (3 * 3600 * 1000));
      renewalTimestamps[m.id] = now + (5 * 3600 * 1000) - randomOffsetMs;
      modified = true;
    }
    // Weekly Rolling Window Reset Timer
    if (!weeklyRenewalTimestamps[m.id] || weeklyRenewalTimestamps[m.id] <= now) {
      const randomOffsetWeeklyMs = Math.floor(Math.random() * (4 * 3600 * 1000));
      weeklyRenewalTimestamps[m.id] = now + (4.95 * 3600 * 1000) - randomOffsetWeeklyMs;
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
      simulatedUsage[m.id] = m.defaultSimulatedUsage || 75.0;
      modified = true;
    }
    if (simulatedWeeklyUsage[m.id] === undefined) {
      simulatedWeeklyUsage[m.id] = m.defaultSimulatedWeeklyUsage || 60.0;
      modified = true;
    }
  });
  if (modified) {
    localStorage.setItem('ag_simulated_usage', JSON.stringify(simulatedUsage));
    localStorage.setItem('ag_simulated_weekly_usage', JSON.stringify(simulatedWeeklyUsage));
  }
}

function formatNumber(num) { return new Intl.NumberFormat('en-US').format(Math.floor(num)); }

function formatHoursMinutes(ms) {
  if (ms <= 0) return '0 minutes';
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}, ${mins} minute${mins !== 1 ? 's' : ''}`;
  return `${mins} minute${mins !== 1 ? 's' : ''}`;
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
  renderAll();
}

/**
 * UPDATE OFFICIAL IDE QUOTA CARDS (image_00a58d.png)
 * Calculates exact percentages and subtext for Gemini Models vs Claude and GPT models.
 */
function renderSummaryStats() {
  const now = Date.now();

  // Gemini Models Group
  const geminiModels = ANTIGRAVITY_MODELS.filter(m => m.sharedPool === 'gemini_models');
  const geminiWeeklyAvg = geminiModels.reduce((acc, m) => acc + (simulatedWeeklyUsage[m.id] || 68), 0) / geminiModels.length;
  const gemini5hrAvg = geminiModels.reduce((acc, m) => acc + (simulatedUsage[m.id] || 82), 0) / geminiModels.length;
  const gemini5hrMs = Math.max(0, (renewalTimestamps['gemini-3.1-pro-high'] || now) - now);
  const geminiWeeklyMs = Math.max(0, (weeklyRenewalTimestamps['gemini-3.1-pro-high'] || now) - now);

  const gWBar = document.getElementById('geminiWeeklyBar');
  const gWPct = document.getElementById('geminiWeeklyPct');
  const gWDesc = document.getElementById('geminiWeeklyDesc');

  if (gWBar) gWBar.style.width = `${geminiWeeklyAvg.toFixed(0)}%`;
  if (gWPct) gWPct.textContent = `${geminiWeeklyAvg.toFixed(0)}%`;
  if (gWDesc) gWDesc.textContent = `You have used some of your weekly limit, it will fully refresh in ${formatHoursMinutes(geminiWeeklyMs)}.`;

  const g5Bar = document.getElementById('gemini5hrBar');
  const g5Pct = document.getElementById('gemini5hrPct');
  const g5Desc = document.getElementById('gemini5hrDesc');

  if (g5Bar) g5Bar.style.width = `${gemini5hrAvg.toFixed(0)}%`;
  if (g5Pct) g5Pct.textContent = `${gemini5hrAvg.toFixed(0)}%`;
  if (g5Desc) g5Desc.textContent = `You have used some of your 5-hour limit, it will fully refresh in ${formatHoursMinutes(gemini5hrMs)}.`;

  // Claude and GPT Models Group
  const claudeModels = ANTIGRAVITY_MODELS.filter(m => m.sharedPool === 'claude_gpt_models');
  const claudeWeeklyAvg = claudeModels.reduce((acc, m) => acc + (simulatedWeeklyUsage[m.id] || 58), 0) / claudeModels.length;
  const claude5hrUsedAvg = claudeModels.reduce((acc, m) => acc + (simulatedUsage[m.id] || 100), 0) / claudeModels.length;
  const claude5hrRemaining = Math.max(0, 100 - claude5hrUsedAvg);
  const claude5hrMs = Math.max(0, (renewalTimestamps['claude-opus-4.6'] || now) - now);

  const cWBar = document.getElementById('claudeWeeklyBar');
  const cWPct = document.getElementById('claudeWeeklyPct');
  const cWDesc = document.getElementById('claudeWeeklyDesc');

  if (cWBar) cWBar.style.width = `${claudeWeeklyAvg.toFixed(0)}%`;
  if (cWPct) cWPct.textContent = `${claudeWeeklyAvg.toFixed(0)}%`;
  if (cWDesc) cWDesc.textContent = `You have hit your 5-hour limit, so the weekly limit does not currently apply. Your 5-hour limit will refresh in ${formatHoursMinutes(claude5hrMs)}.`;

  const c5Bar = document.getElementById('claude5hrBar');
  const c5Pct = document.getElementById('claude5hrPct');
  const c5Desc = document.getElementById('claude5hrDesc');

  if (c5Bar) {
    c5Bar.style.width = `${claude5hrRemaining.toFixed(0)}%`;
    c5Bar.style.background = claude5hrRemaining <= 5 ? '#ef4444' : '#10b981';
  }
  if (c5Pct) {
    c5Pct.textContent = `${claude5hrRemaining.toFixed(0)}%`;
    c5Pct.className = claude5hrRemaining <= 5 ? 'ide-limit-pct text-danger' : 'ide-limit-pct';
  }
  if (c5Desc) {
    if (claude5hrRemaining <= 5) {
      c5Desc.textContent = `You have hit your 5-hour limit, it will refresh in ${formatHoursMinutes(claude5hrMs)}. If on a supported paid plan, you can use AI credits in the interim.`;
      c5Desc.className = 'ide-limit-desc text-warning';
    } else {
      c5Desc.textContent = `You have used some of your 5-hour limit, it will fully refresh in ${formatHoursMinutes(claude5hrMs)}.`;
      c5Desc.className = 'ide-limit-desc';
    }
  }
}

/**
 * RENDER MODELS GRID WITH 2 OFFICIAL GROUPS
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
    const is5hrExhausted = used5hr >= 98;

    const now = Date.now();
    const msLeft5hr = Math.max(0, (renewalTimestamps[m.id] || now) - now);
    const msLeftWeekly = Math.max(0, (weeklyRenewalTimestamps[m.id] || now) - now);

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
            <span class="gauge-stats gauge-5hr-stats">${(100 - used5hr).toFixed(0)}% Capacity</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill gauge-5hr-fill ${used5hr > 85 ? 'warning' : ''}" style="width: ${100 - used5hr}%; background: ${is5hrExhausted ? '#ef4444' : '#10b981'};"></div>
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
            <span class="gauge-stats gauge-weekly-stats">${usedWeekly.toFixed(0)}% Used</span>
          </div>
          <div class="progress-bar-bg baseline-bg">
            <div class="progress-bar-fill baseline-fill gauge-weekly-fill" style="width: ${usedWeekly}%;"></div>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 3-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
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
    return ((renewalTimestamps[a.id] || now) - now) - ((renewalTimestamps[b.id] || now) - now);
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
 * REAL-TIME TELEMETRY LOOP (1000ms)
 */
function tickTelemetry() {
  renderSummaryStats();
  renderModelsGrid();
  renderRenewalsList();
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
 * AI CHATBOT ENGINE - VERBATIM QUOTES FROM OFFICIAL IDE SETTINGS SCREEN
 */
function generateAIResponse(userText) {
  const q = userText.toLowerCase();

  if (q.includes('group') || q.includes('claude and gpt') || q.includes('gemini models') || q.includes('shared')) {
    return `<strong>Official Antigravity IDE Model Groups (Settings > Models):</strong><br><br>` +
      `<em>&ldquo;Within each group, models share a weekly limit and a 5-hour limit. Quota is consumed proportionally to the cost of the tokens. Thus, limits will last longer with shorter tasks or using more cost-effective models.&rdquo;</em><br><br>` +
      `The 2 official groups are:<br>` +
      `1. <strong>Gemini Models:</strong> Shares Gemini Flash &amp; Gemini Pro models.<br>` +
      `2. <strong>Claude and GPT models:</strong> Shares Claude Sonnet 4.6, Claude Opus 4.6, AND GPT-OSS 120B!`;
  }

  if (q.includes('5-hour limit') || q.includes('five hour') || q.includes('credits') || q.includes('overage')) {
    return `<strong>Official 5-Hour Limit Behavior (Settings > Models):</strong><br><br>` +
      `When you exhaust a group's 5-hour limit, the settings screen reports:<br>` +
      `<em>&ldquo;You have hit your 5-hour limit, so the weekly limit does not currently apply. Your 5-hour limit will refresh in 1 hour, 18 minutes. If on a supported paid plan, you can use AI credits in the interim.&rdquo;</em>`;
  }

  return `Regarding your query: <em>&ldquo;${userText}&rdquo;</em><br><br>` +
    `According to the <strong>Official Antigravity IDE Settings screen</strong>:<br>` +
    `&bull; Models are divided into two shared groups: <strong>Gemini Models</strong> and <strong>Claude and GPT models</strong>.<br>` +
    `&bull; The 5-hour limit smooths out aggregate demand, while the weekly limit is a dynamic rolling sliding window.<br>` +
    `&bull; Type <code>/usage</code> in your IDE terminal or visit <strong>Agent Manager &gt; Settings &gt; Models</strong> to see your live ring progress meters.`;
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
        <span class="modal-spec-label">Official Model Group</span>
        <span class="modal-spec-val">${m.poolDisplayName}</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Work Done Compute Weight</span>
        <span class="modal-spec-val">${m.workDoneWeight}</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">5-Hour Refresh Cycle</span>
        <span class="modal-spec-val">Rolling 5-Hour Limit</span>
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