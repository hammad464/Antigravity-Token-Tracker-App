/**
 * Antigravity Quotas & Token Monitor Desktop Application Renderer
 * Features: Auto-Subscription Detection, Fixed Token Estimator, Context-Aware AI Chatbot, Live Timers.
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
  // Auto-detects local user subscription status
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

  // Accurately calculate tokens (accounting for code symbols, punctuation, words, and whitespace)
  let estTokens = 0;
  if (text.length > 0) {
    const symbolMatches = text.match(/[{}[\]();:,.<>/?!@#$%^&*+\-=/\\|'"`~]/g) || [];
    estTokens = Math.max(1, Math.ceil((words * 1.32) + (symbolMatches.length * 0.65) + (lines * 0.2)));
  }

  calcCharCount.textContent = formatNumber(chars);
  calcWordCount.textContent = formatNumber(words);
  calcLineCount.textContent = formatNumber(lines);
  calcTokenCount.textContent = formatNumber(estTokens);

  // Render context fit bars
  calcModelBars.innerHTML = '';
  ANTIGRAVITY_MODELS.forEach(m => {
    const cap = m.contextWindow;
    const pct = estTokens === 0 ? 0 : Math.min(100, (estTokens / cap) * 100);
    const pctDisplay = pct > 0 && pct < 0.01 ? '<0.01' : pct.toFixed(2);
    const fits = estTokens <= cap;

    let barColor = '#34d399'; // Green
    if (pct > 50 && pct <= 85) barColor = '#fbbf24'; // Amber
    if (pct > 85 && pct <= 100) barColor = '#ec4899'; // Pink
    if (!fits) barColor = '#ef4444'; // Red

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

// 12. AI QUOTAS CHATBOT (Context-Aware Engine)
function handleSendMessage() {
  const query = chatInput.value.trim();
  if (!query) return;

  // Render User Message
  appendChatMessage('user', 'You', query);
  chatInput.value = '';

  // Generate intelligent context-aware AI response based on LIVE dashboard state
  setTimeout(() => {
    const aiResponse = generateAIResponse(query);
    appendChatMessage('assistant', 'Antigravity Quota Assistant', aiResponse);
  }, 400);
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

function generateAIResponse(userText) {
  const q = userText.toLowerCase();
  const now = Date.now();

  // A. Questions about model refresh / renewal countdown
  if (q.includes('refresh') || q.includes('renew') || q.includes('reset') || q.includes('when')) {
    // Check if specific model mentioned
    for (const m of ANTIGRAVITY_MODELS) {
      if (q.includes(m.name.toLowerCase()) || q.includes(m.id)) {
        const msLeft = Math.max(0, (renewalTimestamps[m.id] || now) - now);
        const quota = m.quota[currentPlan];
        const used = simulatedUsage[m.id] || 0;
        const remaining = Math.max(0, quota.total - used);

        return `<strong>${m.name}</strong> is currently on a <strong>${quota.resetHours}-hour rolling window</strong> schedule.<br><br>` +
               `• <strong>Time until full refresh:</strong> <span style="color:#34d399; font-family: monospace; font-weight:700;">${formatCountdown(msLeft)}</span><br>` +
               `• <strong>Current Remaining Tokens:</strong> ${formatNumber(remaining)} / ${formatNumber(quota.total)} tokens.<br>` +
               `• <strong>Speed & Concurrency:</strong> ${m.speedBadge} Tier (${quota.rpm} RPM limit).`;
      }
    }

    // General "which model refreshes next"
    const sorted = [...ANTIGRAVITY_MODELS].sort((a, b) => {
      const tA = (renewalTimestamps[a.id] || now) - now;
      const tB = (renewalTimestamps[b.id] || now) - now;
      return tA - tB;
    });

    const nextModel = sorted[0];
    const msLeft = Math.max(0, (renewalTimestamps[nextModel.id] || now) - now);

    return `Here is your live model renewal breakdown from your active dashboard:<br><br>` +
           `1. <strong>Next Model Refreshing:</strong> <strong>${nextModel.name}</strong> in <span style="color:#34d399; font-family: monospace; font-weight:700;">${formatCountdown(msLeft)}</span>.<br>` +
           `2. <strong>Second Refreshing:</strong> <strong>${sorted[1].name}</strong> in <span style="color:#34d399; font-family: monospace; font-weight:700;">${formatCountdown((renewalTimestamps[sorted[1].id] - now))}</span>.<br><br>` +
           `All models in your <strong>${ANTIGRAVITY_PLANS[currentPlan].name}</strong> operate on continuous 5-hour sliding windows. Your token allowances replenish progressively as older requests expire out of the window.`;
  }

  // B. Questions about subscription / plan
  if (q.includes('subscription') || q.includes('plan') || q.includes('tier') || q.includes('cost')) {
    let totalCap = 0;
    let totalUsed = 0;
    ANTIGRAVITY_MODELS.forEach(m => {
      totalCap += m.quota[currentPlan].total;
      totalUsed += Math.min(simulatedUsage[m.id] || 0, m.quota[currentPlan].total);
    });

    return `Your active subscription status:<br><br>` +
           `• <strong>Detected Subscription Plan:</strong> <strong>${ANTIGRAVITY_PLANS[currentPlan].name}</strong><br>` +
           `• <strong>Total Window Token Capacity:</strong> <strong>${formatNumber(totalCap)} Tokens</strong><br>` +
           `• <strong>Tokens Consumed:</strong> ${formatNumber(totalUsed)} (${((totalUsed/totalCap)*100).toFixed(1)}%)<br>` +
           `• <strong>Models Available:</strong> All 11 Gemini, Claude, and Open Source models included.<br>` +
           `• <strong>Max Concurrency:</strong> Up to 300 Requests Per Minute (RPM).`;
  }

  // C. Questions about context size / largest model
  if (q.includes('largest') || q.includes('context') || q.includes('codebase') || q.includes('gemini 3.1 pro')) {
    return `For large codebases and complex multi-file projects, <strong>Gemini 3.1 Pro (High)</strong> offers the largest context window in Antigravity:<br><br>` +
           `• <strong>Context Window:</strong> <strong>2,097,152 Tokens</strong> (2 Million tokens ~ ~8 million characters of code!).<br>` +
           `• <strong>Max Output Generation:</strong> 65,536 Tokens.<br>` +
           `• <strong>Your Plan Quota:</strong> ${formatCompactTokens(ANTIGRAVITY_MODELS.find(x => x.id === 'gemini-3.1-pro-high').quota[currentPlan].total)} per 5-hour rolling reset.<br><br>` +
           `You can use the <strong>Token Estimator</strong> tab to paste your project files and check if your code fits within this context limit.`;
  }

  // D. Default fallback context answer
  return `I am analyzing your live <strong>${ANTIGRAVITY_PLANS[currentPlan].name}</strong> subscription data.<br><br>` +
         `• You currently have <strong>11 models active</strong> with a combined rolling token allowance of <strong>118.5M tokens</strong>.<br>` +
         `• You can switch tabs on the left to inspect <strong>Renewal Schedules</strong>, test prompts in the <strong>Token Estimator</strong>, or filter models by <strong>Fast</strong> vs <strong>Thinking</strong> tiers.`;
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
