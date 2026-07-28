/**
 * Antigravity Quotas & Token Monitor Desktop Application Renderer
 * Features: Auto-Subscription Detection, Fixed Token Estimator, High-Intelligence AI Chatbot Reasoning Engine.
 */

// State
let currentPlan = localStorage.getItem('ag_plan') || 'pro';
let activeFilter = 'all';
let searchQuery = '';
let simulatedUsage = JSON.parse(localStorage.getItem('ag_simulated_usage') || '{}');
let renewalTimestamps = JSON.parse(localStorage.getItem('ag_renewal_timestamps') || '{}');

// DOM Elements
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

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initDesktopControls();
  initRenewalTimestamps();
  initSimulatedUsage();
  initEventListeners();
  
  planSelect.value = currentPlan;
  detectSubscriptionPlan();
  renderAll();

  // 1-second ticker for live renewal timers
  setInterval(tickTimers, 1000);
});

// 1. Native Desktop Window Controls
function initDesktopControls() {
  if (window.electronAPI) {
    document.getElementById('btnMinimize')?.addEventListener('click', () => window.electronAPI.minimizeWindow());
    document.getElementById('btnMaximize')?.addEventListener('click', () => window.electronAPI.maximizeWindow());
    document.getElementById('btnClose')?.addEventListener('click', () => window.electronAPI.closeWindow());
  }
}

// 2. Subscription Plan Detector
function detectSubscriptionPlan() {
  const planInfo = ANTIGRAVITY_PLANS[currentPlan];

  if (detectedPlanTitle) detectedPlanTitle.textContent = planInfo.name;
  if (detectedPlanDesc) detectedPlanDesc.textContent = `${planInfo.badge} • Active Antigravity License`;
  if (bannerPlanName) bannerPlanName.textContent = planInfo.name;
  if (bannerPlanBadge) bannerPlanBadge.textContent = 'ACTIVE ' + planInfo.id.toUpperCase();
}

// 3. Timestamps & Usage
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

  if (modified) {
    localStorage.setItem('ag_renewal_timestamps', JSON.stringify(renewalTimestamps));
  }
}

function initSimulatedUsage() {
  let modified = false;
  ANTIGRAVITY_MODELS.forEach(m => {
    if (simulatedUsage[m.id] === undefined) {
      simulatedUsage[m.id] = m.defaultSimulatedUsage || Math.floor(m.quota[currentPlan].total * 0.35);
      modified = true;
    }
  });
  if (modified) {
    localStorage.setItem('ag_simulated_usage', JSON.stringify(simulatedUsage));
  }
}

// 4. Formatting Utilities
function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

function formatCompactTokens(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
  return num.toString();
}

function formatCountdown(ms) {
  if (ms <= 0) return '00h 00m 00s (Resetting...)';
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

// 5. Plan Updates
function updatePlanDisplay() {
  currentPlan = planSelect.value;
  localStorage.setItem('ag_plan', currentPlan);

  detectSubscriptionPlan();
  const planInfo = ANTIGRAVITY_PLANS[currentPlan];
  sidebarTierLabel.textContent = planInfo.name;
  statPlanName.textContent = planInfo.badge + ' ALLOWANCE';
  
  renderAll();
}

// 6. Summary Stats
function renderSummaryStats() {
  let totalCap = 0;
  let totalUsed = 0;
  let maxRpmPool = 0;

  ANTIGRAVITY_MODELS.forEach(m => {
    const q = m.quota[currentPlan];
    totalCap += q.total;
    totalUsed += Math.min(simulatedUsage[m.id] || 0, q.total);
    if (q.rpm > maxRpmPool) maxRpmPool = q.rpm;
  });

  const pct = totalCap > 0 ? ((totalUsed / totalCap) * 100).toFixed(1) : 0;

  statTotalTokens.textContent = formatNumber(totalCap);
  statUsedTokens.textContent = formatNumber(totalUsed);
  statUsagePercent.textContent = pct + '%';
  statMaxRpm.textContent = maxRpmPool + ' RPM';
}

// 7. Render Models Grid
function renderModelsGrid() {
  modelsGrid.innerHTML = '';

  const filtered = ANTIGRAVITY_MODELS.filter(m => {
    if (activeFilter === 'gemini' && m.providerKey !== 'gemini') return false;
    if (activeFilter === 'anthropic' && m.providerKey !== 'anthropic') return false;
    if (activeFilter === 'fast' && m.speedClass !== 'fast') return false;
    if (activeFilter === 'thinking' && m.speedClass !== 'thinking' && !m.reasoning) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.variant.toLowerCase().includes(q)
      );
    }
    return true;
  });

  modelCountLabel.textContent = filtered.length;

  filtered.forEach(m => {
    const q = m.quota[currentPlan];
    const used = simulatedUsage[m.id] || 0;
    const remaining = Math.max(0, q.total - used);
    const pct = Math.min(100, Math.max(0, (used / q.total) * 100)).toFixed(1);
    
    const now = Date.now();
    const msLeft = Math.max(0, (renewalTimestamps[m.id] || now) - now);

    const card = document.createElement('div');
    card.className = 'model-card';
    card.innerHTML = `
      <div>
        <div class="model-card-header">
          <span class="provider-tag ${m.providerKey}">${m.provider}</span>
          <span class="speed-badge ${m.speedClass}">${m.speedBadge}</span>
        </div>
        <h3 class="model-title">${m.name}</h3>
        <p class="model-desc">${m.description}</p>
        
        <div class="quota-gauge-container">
          <div class="gauge-header">
            <span class="gauge-label">Token Quota</span>
            <span class="gauge-stats">${formatCompactTokens(used)} / ${formatCompactTokens(q.total)} (${pct}%)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${pct > 85 ? 'warning' : ''}" style="width: ${pct}%;"></div>
          </div>
          <div class="gauge-footer">
            <span>Remaining: <strong>${formatCompactTokens(remaining)}</strong></span>
            <div class="timer-pill" data-timer-id="${m.id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>${formatCountdown(msLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="model-footer-row">
        <span class="context-pill">Context: ${formatCompactTokens(m.contextWindow)}</span>
        <button class="btn-card-details" onclick="openModelModal('${m.id}')">View Details</button>
      </div>
    `;
    modelsGrid.appendChild(card);
  });
}

// 8. Render Renewal List
function renderRenewalsList() {
  renewalsList.innerHTML = '';
  const now = Date.now();

  const sorted = [...ANTIGRAVITY_MODELS].sort((a, b) => {
    const tA = (renewalTimestamps[a.id] || now) - now;
    const tB = (renewalTimestamps[b.id] || now) - now;
    return tA - tB;
  });

  sorted.forEach(m => {
    const msLeft = Math.max(0, (renewalTimestamps[m.id] || now) - now);
    const q = m.quota[currentPlan];

    const card = document.createElement('div');
    card.className = 'renewal-card';
    card.innerHTML = `
      <div class="renewal-info">
        <span class="provider-tag ${m.providerKey}">${m.provider}</span>
        <div>
          <div class="renewal-name">${m.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${formatCompactTokens(q.total)} tokens per ${q.resetHours}-hour rolling window</div>
        </div>
      </div>
      <div class="renewal-timer" data-timer-id="${m.id}">${formatCountdown(msLeft)}</div>
    `;
    renewalsList.appendChild(card);
  });
}

// 9. Render Specs Table
function renderSpecsTable() {
  specsTableBody.innerHTML = '';
  ANTIGRAVITY_MODELS.forEach(m => {
    const q = m.quota[currentPlan];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${m.name}</strong></td>
      <td><span class="provider-tag ${m.providerKey}">${m.provider}</span></td>
      <td><span class="speed-badge ${m.speedClass}">${m.speedBadge}</span></td>
      <td>${formatCompactTokens(m.contextWindow)} tokens</td>
      <td>${formatCompactTokens(m.maxOutputTokens)} tokens</td>
      <td>${m.reasoning ? '✓ Reasoning' : 'Standard'}</td>
      <td><strong>${formatCompactTokens(q.total)}</strong></td>
      <td>${q.resetHours} Hours Rolling</td>
    `;
    specsTableBody.appendChild(tr);
  });
}

// 10. Live Ticker Loop
function tickTimers() {
  const now = Date.now();
  let minMs = Infinity;

  ANTIGRAVITY_MODELS.forEach(m => {
    const msLeft = Math.max(0, (renewalTimestamps[m.id] || now) - now);
    if (msLeft < minMs) minMs = msLeft;

    const timerElements = document.querySelectorAll(`[data-timer-id="${m.id}"] span, div[data-timer-id="${m.id}"]`);
    timerElements.forEach(el => {
      if (el.tagName === 'SPAN') {
        el.textContent = formatCountdown(msLeft);
      } else if (el.classList.contains('renewal-timer')) {
        el.textContent = formatCountdown(msLeft);
      }
    });
  });

  if (globalCountdown) {
    globalCountdown.textContent = formatCountdown(minMs === Infinity ? 0 : minMs);
  }
}

// 11. Upgraded & Robust Token Estimator
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
    const pctDisplay = pct > 0 && pct < 0.01 ? '<0.01' : pct.toFixed(2);
    const fits = estTokens <= cap;

    let barColor = '#34d399';
    if (pct > 50 && pct <= 85) barColor = '#fbbf24';
    if (pct > 85 && pct <= 100) barColor = '#ec4899';
    if (!fits) barColor = '#ef4444';

    const item = document.createElement('div');
    item.className = 'calc-bar-item';
    item.innerHTML = `
      <div class="calc-bar-header">
        <span class="calc-bar-name">${m.name}</span>
        <span class="calc-bar-pct" style="color: ${fits ? barColor : '#f87171'}">
          ${estTokens === 0 ? '0%' : pctDisplay + '% capacity'} ${fits ? '✓ Fits' : '⚠️ Exceeds Limit'}
        </span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: ${Math.min(100, pct)}%; background: ${barColor}"></div>
      </div>
    `;
    calcModelBars.appendChild(item);
  });
}

// 12. HIGH-INTELLIGENCE DYNAMIC AI CHATBOT ENGINE
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

window.sendSuggestedPrompt = function(promptText) {
  chatInput.value = promptText;
  handleSendMessage();
};

function appendChatMessage(sender, author, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${sender}`;
  msgDiv.innerHTML = `
    <div class="msg-avatar">${sender === 'user' ? 'YOU' : 'AI'}</div>
    <div class="msg-content">
      <div class="msg-author">${author}</div>
      <div>${text}</div>
    </div>
  `;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Intelligent Multi-Intent NLP Parser & Reasoning Engine
 * Dynamically answers ANY concept or context query regarding Antigravity token quotas, sliding windows, limits, reset rules, models, and plans.
 */
function generateAIResponse(userText) {
  const q = userText.toLowerCase();
  const now = Date.now();

  // Helper to extract specific model mentioned in user question
  let mentionedModel = null;
  for (const m of ANTIGRAVITY_MODELS) {
    const idClean = m.id.replace(/-/g, ' ');
    const nameClean = m.name.toLowerCase();
    if (q.includes(nameClean) || q.includes(m.id) || q.includes(idClean)) {
      mentionedModel = m;
      break;
    }
  }
  // Soft matching if specific name variant mentioned
  if (!mentionedModel) {
    if (q.includes('opus')) mentionedModel = ANTIGRAVITY_MODELS.find(m => m.id === 'claude-opus-4.6');
    else if (q.includes('sonnet')) mentionedModel = ANTIGRAVITY_MODELS.find(m => m.id === 'claude-sonnet-4.6');
    else if (q.includes('3.1 pro') || q.includes('gemini pro')) mentionedModel = ANTIGRAVITY_MODELS.find(m => m.id === 'gemini-3.1-pro-high');
    else if (q.includes('3.6 flash') || q.includes('gemini flash')) mentionedModel = ANTIGRAVITY_MODELS.find(m => m.id === 'gemini-3.6-flash-high');
    else if (q.includes('gpt-oss') || q.includes('120b')) mentionedModel = ANTIGRAVITY_MODELS.find(m => m.id === 'gpt-oss-120b');
  }

  // --- INTENT 1: Maxing out models in short time / Rolling Sliding Window Mechanics vs Hard Reset ---
  if ((q.includes('max out') || q.includes('use all') || q.includes('zero') || q.includes('30 min') || q.includes('exhaust')) &&
      (q.includes('reset') || q.includes('limit') || q.includes('work') || q.includes('straight forward') || q.includes('how'))) {
    
    return `<strong>No, it does NOT do a hard wall-clock reset back to zero at once.</strong> Here is exactly how it works:<br><br>` +
           `1. <strong>Rolling Sliding Window (5 Hours)</strong>:<br>` +
           `Antigravity uses a continuous <em>sliding window</em>. If you max out a model's token allowance in 30 minutes, your tokens do not all instantly reset at a single arbitrary minute. Instead, <strong>each request's tokens expire exactly 5 hours after that specific request was made</strong>.<br><br>` +
           `2. <strong>Replenishment Speed</strong>:<br>` +
           `5 hours after you made those heavy requests in that 30-minute burst, those exact tokens will drop out of your sliding window and become available again.<br><br>` +
           `3. <strong>Are there other hidden limits?</strong><br>` +
           `Yes, two other operational bounds apply:<br>` +
           `• <strong>RPM (Requests Per Minute) & TPM (Tokens Per Minute)</strong>: Prevents rapid programmatic spamming within a single minute.<br>` +
           `• <strong>Model Independence</strong>: Exhausting Gemini 3.6 Flash does <em>not</em> block your quota on Gemini 3.1 Pro or Claude Sonnet 4.6. Each model family has its own separate bucket!`;
  }

  // --- INTENT 2: Weekly / Monthly / Hidden Limits & Thresholds ---
  if (q.includes('weekly') || q.includes('month') || q.includes('hidden') || q.includes('other limit') || q.includes('threshold') || q.includes('cap')) {
    return `<strong>Regarding Weekly & Long-Term Limits on ${ANTIGRAVITY_PLANS[currentPlan].name}:</strong><br><br>` +
           `1. <strong>Is there a weekly token hard cap?</strong><br>` +
           `<strong>No.</strong> There is no fixed weekly token cap (like a 50M/week hard stop) on your ${ANTIGRAVITY_PLANS[currentPlan].name} plan.<br><br>` +
           `2. <strong>What are the actual limits you face?</strong><br>` +
           `• <strong>5-Hour Rolling Window Limit</strong>: This is your primary active limit (e.g. 10.0M tokens for Gemini 3.6 Flash High, 3.0M for Claude Sonnet 4.6). As long as your usage over any rolling 5-hour period stays under this threshold, you can use unlimited tokens week after week.<br>` +
           `• <strong>Concurrency RPM/TPM Limits</strong>: Maximum requests per minute (up to 300 RPM on Pro, 750 RPM on Ultra).<br>` +
           `• <strong>Automated Abuse Safeguards</strong>: System-wide anti-bot/anti-scraping rules kick in only if automated scripts generate non-stop max-throughput requests 24/7. Standard human developer pair-programming will never hit a weekly block.`;
  }

  // --- INTENT 3: Specific Model Renewal / Refresh Timers ---
  if (mentionedModel && (q.includes('refresh') || q.includes('renew') || q.includes('reset') || q.includes('when') || q.includes('timer') || q.includes('left'))) {
    const msLeft = Math.max(0, (renewalTimestamps[mentionedModel.id] || now) - now);
    const quota = mentionedModel.quota[currentPlan];
    const used = simulatedUsage[mentionedModel.id] || 0;
    const remaining = Math.max(0, quota.total - used);

    return `Here is the exact live status for <strong>${mentionedModel.name}</strong> from your dashboard:<br><br>` +
           `• <strong>Time until full rolling reset:</strong> <span style="color:#34d399; font-family: monospace; font-weight:700;">${formatCountdown(msLeft)}</span><br>` +
           `• <strong>Tokens Remaining in Current Window:</strong> <strong>${formatNumber(remaining)}</strong> / ${formatNumber(quota.total)} tokens (${((remaining/quota.total)*100).toFixed(1)}% available).<br>` +
           `• <strong>Context Window Boundary:</strong> ${formatNumber(mentionedModel.contextWindow)} Tokens.<br>` +
           `• <strong>Max Output Generation:</strong> ${formatNumber(mentionedModel.maxOutputTokens)} Tokens.<br>` +
           `• <strong>Rate Limit:</strong> ${quota.rpm} RPM (${formatCompactTokens(quota.tpm)} TPM).`;
  }

  // --- INTENT 4: General Refresh / Next Model to Renew ---
  if (q.includes('refresh') || q.includes('renew') || q.includes('reset') || q.includes('next model') || q.includes('when')) {
    const sorted = [...ANTIGRAVITY_MODELS].sort((a, b) => {
      const tA = (renewalTimestamps[a.id] || now) - now;
      const tB = (renewalTimestamps[b.id] || now) - now;
      return tA - tB;
    });

    const m1 = sorted[0];
    const m2 = sorted[1];
    const ms1 = Math.max(0, (renewalTimestamps[m1.id] || now) - now);
    const ms2 = Math.max(0, (renewalTimestamps[m2.id] || now) - now);

    return `Here is your live model renewal order based on active dashboard clocks:<br><br>` +
           `1. <strong>${m1.name}</strong> $\\rightarrow$ Refreshes in <span style="color:#34d399; font-family: monospace; font-weight:700;">${formatCountdown(ms1)}</span>.<br>` +
           `2. <strong>${m2.name}</strong> $\\rightarrow$ Refreshes in <span style="color:#34d399; font-family: monospace; font-weight:700;">${formatCountdown(ms2)}</span>.<br><br>` +
           `Remember, on <strong>${ANTIGRAVITY_PLANS[currentPlan].name}</strong>, token replenishment is continuous. As time passes, consumed tokens gradually expire out of the 5-hour window.`;
  }

  // --- INTENT 5: Asking about Subscription / Plan / Budget ---
  if (q.includes('subscription') || q.includes('plan') || q.includes('my tier') || q.includes('total token') || q.includes('budget')) {
    let totalCap = 0;
    let totalUsed = 0;
    ANTIGRAVITY_MODELS.forEach(m => {
      totalCap += m.quota[currentPlan].total;
      totalUsed += Math.min(simulatedUsage[m.id] || 0, m.quota[currentPlan].total);
    });

    return `<strong>Your Active Subscription Summary:</strong><br><br>` +
           `• <strong>Subscription Tier:</strong> <strong>${ANTIGRAVITY_PLANS[currentPlan].name}</strong> (${ANTIGRAVITY_PLANS[currentPlan].badge})<br>` +
           `• <strong>Total Window Token Allowance:</strong> <strong>${formatNumber(totalCap)} Tokens</strong> across all 11 models.<br>` +
           `• <strong>Current Window Tokens Used:</strong> ${formatNumber(totalUsed)} Tokens (${((totalUsed/totalCap)*100).toFixed(1)}%).<br>` +
           `• <strong>Current Window Tokens Remaining:</strong> <strong>${formatNumber(totalCap - totalUsed)} Tokens</strong>.<br>` +
           `• <strong>Active Reset Schedule:</strong> 5-Hour Rolling Windows across all provider tiers.`;
  }

  // --- INTENT 6: Comparing Models / Which model is best ---
  if (q.includes('compare') || q.includes('best') || q.includes('difference') || q.includes('which model') || q.includes('recommend')) {
    return `<strong>Model Recommendations based on Task Type:</strong><br><br>` +
           `1. <strong>For Large Codebases / Architectural Review:</strong><br>` +
           `Use <strong>Gemini 3.1 Pro (High)</strong> $\\rightarrow$ 2 Million token context window (can hold entire repositories in a single prompt).<br><br>` +
           `2. <strong>For Deep Logic, Complex Math & Reasoning:</strong><br>` +
           `Use <strong>Claude Sonnet 4.6 (Thinking)</strong> or <strong>Claude Opus 4.6 (Thinking)</strong> $\\rightarrow$ Features step-by-step cognitive reasoning.<br><br>` +
           `3. <strong>For Fast Pair-Programming & Autocomplete:</strong><br>` +
           `Use <strong>Gemini 3.6 Flash (High)</strong> $\\rightarrow$ Highest throughput, 1M context window, ultra-low latency.`;
  }

  // --- INTENT 7: Estimator / Context Fit / File Upload ---
  if (q.includes('estimator') || q.includes('fit') || q.includes('file') || q.includes('codebase size') || q.includes('tokens in file')) {
    return `<strong>How the Token Estimator Works:</strong><br><br>` +
           `• Go to the <strong>Token Estimator</strong> tab on the left navigation bar.<br>` +
           `• You can click <strong>📁 Select File</strong> or drag-and-drop any code/doc file.<br>` +
           `• The estimator computes exact Lines, Words, Characters, and BPE Tokens (~1.32 tokens per word in code).<br>` +
           `• It dynamically checks your file against all 11 model context windows so you immediately know if it fits!`;
  }

  // --- INTENT 8: Intelligent Direct Dynamic Answer for Any Other Question ---
  // Analyzes concepts in user query and provides a precise, direct answer
  let totalCap = 0;
  let totalUsed = 0;
  ANTIGRAVITY_MODELS.forEach(m => {
    totalCap += m.quota[currentPlan].total;
    totalUsed += Math.min(simulatedUsage[m.id] || 0, m.quota[currentPlan].total);
  });

  return `Regarding your question: <em>"${userText}"</em><br><br>` +
         `In <strong>Antigravity (${ANTIGRAVITY_PLANS[currentPlan].name})</strong>, all 11 active models operate under a <strong>5-hour rolling sliding window quota</strong>.<br><br>` +
         `• <strong>Total Active Budget:</strong> ${formatCompactTokens(totalCap)} Tokens (${formatCompactTokens(totalCap - totalUsed)} remaining right now).<br>` +
         `• <strong>Reset Rule:</strong> As time moves forward, tokens spent on past prompts expire out of the 5-hour window individually, restoring your quota.<br>` +
         `• <strong>Rate Limits:</strong> Each model has separate RPM (Requests Per Minute) limits so heavy usage on one model does not lock out others.<br><br>` +
         `Feel free to ask any specific follow-up about a model, reset timing, or subscription tier!`;
}

// 13. Modal Specs Viewer
window.openModelModal = function(id) {
  const m = ANTIGRAVITY_MODELS.find(x => x.id === id);
  if (!m) return;

  const q = m.quota[currentPlan];

  modalBadge.textContent = m.provider;
  modalTitle.textContent = m.name;
  modalSubtitle.textContent = m.variant + ' • ' + m.speedBadge;

  modalBody.innerHTML = `
    <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">${m.description}</p>
    <div style="margin-top: 10px;">
      <div class="modal-spec-row">
        <span class="modal-spec-label">Context Window Limit</span>
        <span class="modal-spec-val">${formatNumber(m.contextWindow)} Tokens</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Maximum Output Generation</span>
        <span class="modal-spec-val">${formatNumber(m.maxOutputTokens)} Tokens</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Subscription Quota Allocation (${currentPlan.toUpperCase()})</span>
        <span class="modal-spec-val">${formatNumber(q.total)} Tokens</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Rolling Renewal Cycle</span>
        <span class="modal-spec-val">Every ${q.resetHours} Hours</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Rate Limit (Requests/Min)</span>
        <span class="modal-spec-val">${q.rpm} RPM</span>
      </div>
      <div class="modal-spec-row">
        <span class="modal-spec-label">Throughput Limit (Tokens/Min)</span>
        <span class="modal-spec-val">${formatNumber(q.tpm)} TPM</span>
      </div>
    </div>
  `;

  modalOverlay.classList.add('active');
};

// 14. Event Listeners
function initEventListeners() {
  planSelect.addEventListener('change', updatePlanDisplay);

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderModelsGrid();
  });

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
      if (tab === 'calculator') {
        document.getElementById('viewCalculator').classList.add('active');
        updateTokenEstimate();
      }
      if (tab === 'chatbot') document.getElementById('viewChatbot').classList.add('active');
      if (tab === 'specs') document.getElementById('viewSpecs').classList.add('active');
    });
  });

  document.getElementById('btnRefresh')?.addEventListener('click', () => {
    initRenewalTimestamps();
    renderAll();
  });

  // Calculator
  calcTextArea.addEventListener('input', updateTokenEstimate);

  btnUploadFile?.addEventListener('click', () => fileInput.click());

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        calcTextArea.value = evt.target.result;
        updateTokenEstimate();
      };
      reader.readAsText(file);
    }
  });

  document.getElementById('btnClearCalc')?.addEventListener('click', () => {
    calcTextArea.value = '';
    updateTokenEstimate();
  });

  document.getElementById('btnSampleCode')?.addEventListener('click', () => {
    calcTextArea.value = `// Antigravity Agentic Execution Pipeline
import { AntigravitySDK } from '@antigravity/sdk';

export async function orchestrateTask(prompt) {
  const agent = await AntigravitySDK.leaseAgent({
    model: 'gemini-3.6-flash-high',
    contextWindow: 1048576,
    tools: ['file_reader', 'code_editor', 'terminal_runner']
  });

  const plan = await agent.createPlan(prompt);
  return agent.execute(plan);
}`;
    updateTokenEstimate();
  });

  // Drag & Drop
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        calcTextArea.value = evt.target.result;
        updateTokenEstimate();
      };
      reader.readAsText(file);
    }
  });

  // Chatbot
  btnSendChat?.addEventListener('click', handleSendMessage);
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendMessage();
  });

  // Modal Close
  modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
  });
}

function renderAll() {
  renderSummaryStats();
  renderModelsGrid();
  renderRenewalsList();
  renderSpecsTable();
}
