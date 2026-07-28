/**
 * Antigravity Quotas & Token Monitor Desktop Application Renderer
 * Coordinates desktop window IPC, real-time timer calculations, model grid updates, and token estimation.
 */

// Application State
let currentPlan = localStorage.getItem('ag_plan') || 'pro';
let activeFilter = 'all';
let searchQuery = '';
let simulatedUsage = JSON.parse(localStorage.getItem('ag_simulated_usage') || '{}');
let renewalTimestamps = JSON.parse(localStorage.getItem('ag_renewal_timestamps') || '{}');

// DOM Elements
const planSelect = document.getElementById('planSelect');
const sidebarTierLabel = document.getElementById('sidebarTierLabel');
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
const calcCharCount = document.getElementById('calcCharCount');
const calcWordCount = document.getElementById('calcWordCount');
const calcTokenCount = document.getElementById('calcTokenCount');
const calcModelBars = document.getElementById('calcModelBars');

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
  updatePlanDisplay();
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

// 2. Initialize Renewal Timestamps (5-hour rolling windows)
function initRenewalTimestamps() {
  const now = Date.now();
  let modified = false;

  ANTIGRAVITY_MODELS.forEach(m => {
    if (!renewalTimestamps[m.id] || renewalTimestamps[m.id] <= now) {
      // Set reset timestamp to 5 hours from now minus a random offset for realism
      const randomOffsetMs = Math.floor(Math.random() * (4 * 3600 * 1000));
      renewalTimestamps[m.id] = now + (m.quota[currentPlan].resetHours * 3600 * 1000) - randomOffsetMs;
      modified = true;
    }
  });

  if (modified) {
    localStorage.setItem('ag_renewal_timestamps', JSON.stringify(renewalTimestamps));
  }
}

// 3. Initialize Usage Data
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

  const planInfo = ANTIGRAVITY_PLANS[currentPlan];
  sidebarTierLabel.textContent = planInfo.name;
  statPlanName.textContent = planInfo.badge + ' ALLOWANCE';
  
  renderSummaryStats();
  renderModelsGrid();
  renderRenewalsList();
  renderSpecsTable();
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
    // Provider/Tier Filter
    if (activeFilter === 'gemini' && m.providerKey !== 'gemini') return false;
    if (activeFilter === 'anthropic' && m.providerKey !== 'anthropic') return false;
    if (activeFilter === 'fast' && m.speedClass !== 'fast') return false;
    if (activeFilter === 'thinking' && m.speedClass !== 'thinking' && !m.reasoning) return false;

    // Search Query Filter
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

  // Sort by shortest remaining reset time
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

  // Find min reset for global countdown stat card
  let minMs = Infinity;

  ANTIGRAVITY_MODELS.forEach(m => {
    const msLeft = Math.max(0, (renewalTimestamps[m.id] || now) - now);
    if (msLeft < minMs) minMs = msLeft;

    // Update individual timer elements in DOM
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

// 11. Interactive Token Estimator
function updateTokenEstimate() {
  const text = calcTextArea.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  
  // Approx token count calculation (1 token ~ 4 characters for English code/text)
  const estTokens = Math.ceil(chars / 3.8);

  calcCharCount.textContent = formatNumber(chars);
  calcWordCount.textContent = formatNumber(words);
  calcTokenCount.textContent = formatNumber(estTokens);

  // Render context fit bars
  calcModelBars.innerHTML = '';
  ANTIGRAVITY_MODELS.forEach(m => {
    const cap = m.contextWindow;
    const pct = Math.min(100, (estTokens / cap) * 100).toFixed(2);
    const fits = estTokens <= cap;

    const item = document.createElement('div');
    item.className = 'calc-bar-item';
    item.innerHTML = `
      <div class="calc-bar-header">
        <span class="calc-bar-name">${m.name}</span>
        <span class="calc-bar-pct" style="color: ${fits ? '#34d399' : '#f87171'}">
          ${estTokens === 0 ? '0%' : pct + '% capacity'} ${fits ? '' : '(Exceeds Limit!)'}
        </span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill ${!fits ? 'warning' : ''}" style="width: ${Math.min(100, pct)}%; background: ${fits ? '#6366f1' : '#ef4444'}"></div>
      </div>
    `;
    calcModelBars.appendChild(item);
  });
}

// 12. Modal Specs Viewer
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
      <div class="modal-spec-row">
        <span class="modal-spec-label">Reasoning / Thinking Support</span>
        <span class="modal-spec-val">${m.reasoning ? 'Yes (Visible Thinking Steps)' : 'Standard High-Speed'}</span>
      </div>
    </div>
  `;

  modalOverlay.classList.add('active');
};

// 13. Event Listeners
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
      if (tab === 'specs') document.getElementById('viewSpecs').classList.add('active');
    });
  });

  // Refresh Sync Button
  document.getElementById('btnRefresh')?.addEventListener('click', () => {
    initRenewalTimestamps();
    renderAll();
  });

  // Calculator
  calcTextArea.addEventListener('input', updateTokenEstimate);

  document.getElementById('btnClearCalc')?.addEventListener('click', () => {
    calcTextArea.value = '';
    updateTokenEstimate();
  });

  document.getElementById('btnSampleCode')?.addEventListener('click', () => {
    calcTextArea.value = `// Sample Antigravity Multi-Agent Task Orchestrator
async function runAgentPipeline(taskConfig) {
  const agent = await AntigravitySDK.leaseAgent({
    model: 'gemini-3.6-flash-high',
    capabilities: ['code_analysis', 'terminal_execution', 'mcp_integration']
  });

  const analysis = await agent.runStep({
    prompt: 'Analyze current project context and construct dependency graph.',
    maxTokens: 32000
  });

  console.log('Execution context loaded:', analysis.summary);
  return analysis;
}`;
    updateTokenEstimate();
  });

  // Drag & Drop Files
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
