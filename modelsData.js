/**
 * Antigravity Models & Quotas Reference Dataset
 * Fully Restored 11 Models Data Model based on Antigravity IDE UI.
 * Features Shared Pools, Dual-Layer Limits (5-Hour Sprint & 7-Day Weekly Baseline), and Work Done compute metrics.
 */

const ANTIGRAVITY_PLANS = {
  pro: {
    id: 'pro',
    name: 'Antigravity Pro',
    description: 'Priority access with 5-hour rolling sprints and a strict 7-day computational baseline limit',
    badge: 'PRO TIER',
    weeklyBaseline: 'Strict 7-day rolling baseline. Exceeding this threshold triggers a priority lockout until the weekly window passes or AI Credit Overages are enabled.'
  },
  ultra: {
    id: 'ultra',
    name: 'Antigravity Ultra / Enterprise',
    description: 'Maximum speed, prioritized thinking models, and 2.5x higher weekly baseline limits',
    badge: 'ULTRA TIER',
    weeklyBaseline: '2.5× higher 7-day rolling baseline. Same lockout mechanics apply but at a significantly elevated ceiling.'
  },
  free: {
    id: 'free',
    name: 'Antigravity Free / Community',
    description: 'Standard access with rate limits, 5-hour rolling windows, and low weekly caps',
    badge: 'COMMUNITY',
    weeklyBaseline: 'Lowest 7-day rolling baseline. Heavy autonomous workloads will trigger lockout quickly. No AI Credit Overages available.'
  }
};

const ANTIGRAVITY_MODELS = [
  {
    id: 'gemini-3.6-flash-high',
    name: 'Gemini 3.6 Flash (High)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_pool',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'High Quota',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares the Gemini Quota Pool. High-speed model ideal for large context code parsing. Quota drains based on "Work Done" compute weight.',
    quota: {
      pro: { total: 10000000, resetHours: 5, rpm: 150, tpm: 2000000, weeklyBaselineLimit: 50000000 },
      ultra: { total: 25000000, resetHours: 5, rpm: 400, tpm: 5000000, weeklyBaselineLimit: 125000000 },
      free: { total: 3000000, resetHours: 5, rpm: 60, tpm: 600000, weeklyBaselineLimit: 15000000 }
    },
    defaultSimulatedUsage: 3420000,
    defaultSimulatedWeeklyUsage: 28400000
  },
  {
    id: 'gemini-3.6-flash-med',
    name: 'Gemini 3.6 Flash (Medium)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_pool',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Balanced Speed',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares the Gemini Quota Pool. Medium throughput variant optimized for standard agentic coding tasks.',
    quota: {
      pro: { total: 10000000, resetHours: 5, rpm: 120, tpm: 1800000, weeklyBaselineLimit: 50000000 },
      ultra: { total: 25000000, resetHours: 5, rpm: 300, tpm: 4500000, weeklyBaselineLimit: 125000000 },
      free: { total: 3000000, resetHours: 5, rpm: 45, tpm: 500000, weeklyBaselineLimit: 15000000 }
    },
    defaultSimulatedUsage: 2100000,
    defaultSimulatedWeeklyUsage: 19500000
  },
  {
    id: 'gemini-3.6-flash-low',
    name: 'Gemini 3.6 Flash (Low)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_pool',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Standard',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares the Gemini Quota Pool. Low concurrency budget variant for quick tab completion and small edits.',
    quota: {
      pro: { total: 10000000, resetHours: 5, rpm: 90, tpm: 1200000, weeklyBaselineLimit: 50000000 },
      ultra: { total: 25000000, resetHours: 5, rpm: 200, tpm: 3000000, weeklyBaselineLimit: 125000000 },
      free: { total: 3000000, resetHours: 5, rpm: 30, tpm: 350000, weeklyBaselineLimit: 15000000 }
    },
    defaultSimulatedUsage: 980000,
    defaultSimulatedWeeklyUsage: 11200000
  },
  {
    id: 'gemini-3.5-flash-high',
    name: 'Gemini 3.5 Flash (High)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_pool',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'High Throughput',
    contextWindow: 1048576,
    maxOutputTokens: 32768,
    reasoning: false,
    multimodal: true,
    description: 'Shares the Gemini Quota Pool. Legacy Flash model with high response speed and solid code synthesis.',
    quota: {
      pro: { total: 10000000, resetHours: 5, rpm: 150, tpm: 2000000, weeklyBaselineLimit: 50000000 },
      ultra: { total: 25000000, resetHours: 5, rpm: 350, tpm: 4000000, weeklyBaselineLimit: 125000000 },
      free: { total: 3000000, resetHours: 5, rpm: 50, tpm: 500000, weeklyBaselineLimit: 15000000 }
    },
    defaultSimulatedUsage: 1450000,
    defaultSimulatedWeeklyUsage: 14200000
  },
  {
    id: 'gemini-3.5-flash-med',
    name: 'Gemini 3.5 Flash (Medium)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_pool',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Balanced',
    contextWindow: 1048576,
    maxOutputTokens: 32768,
    reasoning: false,
    multimodal: true,
    description: 'Shares the Gemini Quota Pool. Reliable medium-tier model for basic refactoring and documentation tasks.',
    quota: {
      pro: { total: 10000000, resetHours: 5, rpm: 100, tpm: 1500000, weeklyBaselineLimit: 50000000 },
      ultra: { total: 25000000, resetHours: 5, rpm: 250, tpm: 3500000, weeklyBaselineLimit: 125000000 },
      free: { total: 3000000, resetHours: 5, rpm: 35, tpm: 400000, weeklyBaselineLimit: 15000000 }
    },
    defaultSimulatedUsage: 890000,
    defaultSimulatedWeeklyUsage: 8900000
  },
  {
    id: 'gemini-3.5-flash-low',
    name: 'Gemini 3.5 Flash (Low)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_pool',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Lightweight',
    contextWindow: 1048576,
    maxOutputTokens: 32768,
    reasoning: false,
    multimodal: true,
    description: 'Shares the Gemini Quota Pool. Lightweight option minimal quota consumption for single file edits.',
    quota: {
      pro: { total: 10000000, resetHours: 5, rpm: 80, tpm: 1000000, weeklyBaselineLimit: 50000000 },
      ultra: { total: 25000000, resetHours: 5, rpm: 180, tpm: 2500000, weeklyBaselineLimit: 125000000 },
      free: { total: 3000000, resetHours: 5, rpm: 25, tpm: 250000, weeklyBaselineLimit: 15000000 }
    },
    defaultSimulatedUsage: 450000,
    defaultSimulatedWeeklyUsage: 4500000
  },
  {
    id: 'gemini-3.1-pro-high',
    name: 'Gemini 3.1 Pro (High)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_pool',
    speedBadge: 'Reasoning',
    speedClass: 'pro',
    variant: 'Deep Reasoning',
    contextWindow: 2097152,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares the Gemini Quota Pool. Massive 2M context window with deep reasoning. Heavy agentic loops consume Work Done quota at accelerated rates.',
    quota: {
      pro: { total: 10000000, resetHours: 5, rpm: 60, tpm: 1000000, weeklyBaselineLimit: 50000000 },
      ultra: { total: 25000000, resetHours: 5, rpm: 150, tpm: 3000000, weeklyBaselineLimit: 125000000 },
      free: { total: 3000000, resetHours: 5, rpm: 20, tpm: 300000, weeklyBaselineLimit: 15000000 }
    },
    defaultSimulatedUsage: 3100000,
    defaultSimulatedWeeklyUsage: 41200000
  },
  {
    id: 'gemini-3.1-pro-low',
    name: 'Gemini 3.1 Pro (Low)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_pool',
    speedBadge: 'Reasoning',
    speedClass: 'pro',
    variant: 'Standard Pro',
    contextWindow: 2097152,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares the Gemini Quota Pool. 2M context model with standard reasoning rate limits.',
    quota: {
      pro: { total: 10000000, resetHours: 5, rpm: 40, tpm: 800000, weeklyBaselineLimit: 50000000 },
      ultra: { total: 25000000, resetHours: 5, rpm: 100, tpm: 2000000, weeklyBaselineLimit: 125000000 },
      free: { total: 3000000, resetHours: 5, rpm: 12, tpm: 200000, weeklyBaselineLimit: 15000000 }
    },
    defaultSimulatedUsage: 1800000,
    defaultSimulatedWeeklyUsage: 22000000
  },
  {
    id: 'claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6 (Thinking)',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    sharedPool: 'third_party_pool',
    speedBadge: 'Thinking',
    speedClass: 'thinking',
    variant: 'Extended Thinking',
    contextWindow: 200000,
    maxOutputTokens: 32768,
    reasoning: true,
    multimodal: true,
    description: 'Shares the Third-Party Quota Pool. Outstanding for algorithmic logic and complex bug detection. Exhausting this model directly reduces Claude Opus capacity.',
    quota: {
      pro: { total: 3000000, resetHours: 5, rpm: 40, tpm: 600000, weeklyBaselineLimit: 15000000 },
      ultra: { total: 10000000, resetHours: 5, rpm: 100, tpm: 2000000, weeklyBaselineLimit: 37500000 },
      free: { total: 800000, resetHours: 5, rpm: 15, tpm: 150000, weeklyBaselineLimit: 4000000 }
    },
    defaultSimulatedUsage: 1950000,
    defaultSimulatedWeeklyUsage: 12100000
  },
  {
    id: 'claude-opus-4.6',
    name: 'Claude Opus 4.6 (Thinking)',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    sharedPool: 'third_party_pool',
    speedBadge: 'Thinking',
    speedClass: 'thinking',
    variant: 'Deep Synthesis',
    contextWindow: 200000,
    maxOutputTokens: 32768,
    reasoning: true,
    multimodal: true,
    description: 'Shares the Third-Party Quota Pool. Deepest cognitive reasoning budget. Drains Work Done quota heavily—a single autonomous session can trigger weekly lockout.',
    quota: {
      pro: { total: 3000000, resetHours: 5, rpm: 25, tpm: 400000, weeklyBaselineLimit: 15000000 },
      ultra: { total: 10000000, resetHours: 5, rpm: 60, tpm: 1200000, weeklyBaselineLimit: 37500000 },
      free: { total: 400000, resetHours: 5, rpm: 10, tpm: 100000, weeklyBaselineLimit: 4000000 }
    },
    defaultSimulatedUsage: 2850000,
    defaultSimulatedWeeklyUsage: 15000000
  },
  {
    id: 'gpt-oss-120b-med',
    name: 'GPT-OSS 120B (Medium)',
    provider: 'Open Source',
    providerKey: 'oss',
    sharedPool: 'oss_pool',
    speedBadge: 'Open Source',
    speedClass: 'fast',
    variant: 'Medium Weights',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    reasoning: true,
    multimodal: false,
    description: 'Shares the OSS Quota Pool. Open-weights model hosted on high-speed inference clusters for privacy-focused agentic coding.',
    quota: {
      pro: { total: 5000000, resetHours: 5, rpm: 80, tpm: 1000000, weeklyBaselineLimit: 25000000 },
      ultra: { total: 15000000, resetHours: 5, rpm: 200, tpm: 3000000, weeklyBaselineLimit: 62500000 },
      free: { total: 1500000, resetHours: 5, rpm: 30, tpm: 300000, weeklyBaselineLimit: 7500000 }
    },
    defaultSimulatedUsage: 2200000,
    defaultSimulatedWeeklyUsage: 16500000
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ANTIGRAVITY_PLANS, ANTIGRAVITY_MODELS };
}