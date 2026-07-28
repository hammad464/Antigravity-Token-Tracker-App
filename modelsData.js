/**
 * Antigravity Models & Quotas Reference Dataset
 * Calibrated against Official Google Antigravity Documentation (antigravity.google/docs).
 * Quotas do NOT use static raw token pools. Compute consumption is governed by "Work Done"
 * (task complexity, subagent loops, terminal execution) across 3 Shared Model Pools.
 */

const ANTIGRAVITY_PLANS = {
  pro: {
    id: 'pro',
    name: 'Antigravity Pro',
    description: 'Priority access with 5-hour rolling sprints and a strict 7-day computational baseline limit',
    badge: 'PRO TIER',
    weeklyBaseline: 'Strict 7-day rolling baseline limit based on accumulated "Work Done". Crossing threshold triggers priority lockout for the remainder of the 7-day window.'
  },
  ultra: {
    id: 'ultra',
    name: 'Antigravity Ultra / Enterprise',
    description: 'Maximum speed, prioritized thinking models, and 2.5x higher weekly baseline limits',
    badge: 'ULTRA TIER',
    weeklyBaseline: '2.5× higher 7-day rolling baseline compute allocation. Priority lockout triggers at significantly higher Work Done thresholds.'
  },
  free: {
    id: 'free',
    name: 'Antigravity Free / Community',
    description: 'Standard access with rate limits, 5-hour rolling windows, and low weekly caps',
    badge: 'COMMUNITY',
    weeklyBaseline: 'Lowest 7-day baseline. Heavy autonomous subagent sessions trigger priority lockout quickly.'
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
    variant: 'High Throughput',
    workDoneWeight: 'Low',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares Gemini Pool. Low Work Done compute cost per prompt. High-speed model ideal for rapid code parsing and multi-file refactoring.',
    quota: {
      pro: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 150, tpm: 2000000, weeklyBaselineLimit: 100 },
      ultra: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 400, tpm: 5000000, weeklyBaselineLimit: 100 },
      free: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 60, tpm: 600000, weeklyBaselineLimit: 100 }
    },
    defaultSimulatedUsage: 34.2,
    defaultSimulatedWeeklyUsage: 56.8
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
    workDoneWeight: 'Low',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares Gemini Pool. Low compute weight variant optimized for general agentic pair-programming tasks.',
    quota: {
      pro: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 120, tpm: 1800000, weeklyBaselineLimit: 100 },
      ultra: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 300, tpm: 4500000, weeklyBaselineLimit: 100 },
      free: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 45, tpm: 500000, weeklyBaselineLimit: 100 }
    },
    defaultSimulatedUsage: 21.0,
    defaultSimulatedWeeklyUsage: 39.0
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
    workDoneWeight: 'Minimal',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares Gemini Pool. Minimal Work Done draw. Economical choice for quick inline completions and single-file edits.',
    quota: {
      pro: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 90, tpm: 1200000, weeklyBaselineLimit: 100 },
      ultra: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 200, tpm: 3000000, weeklyBaselineLimit: 100 },
      free: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 30, tpm: 350000, weeklyBaselineLimit: 100 }
    },
    defaultSimulatedUsage: 9.8,
    defaultSimulatedWeeklyUsage: 22.4
  },
  {
    id: 'gemini-3.5-flash-high',
    name: 'Gemini 3.5 Flash (High)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_pool',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'High Speed',
    workDoneWeight: 'Low',
    contextWindow: 1048576,
    maxOutputTokens: 32768,
    reasoning: false,
    multimodal: true,
    description: 'Shares Gemini Pool. Ultra-fast non-reasoning model with low compute drain.',
    quota: {
      pro: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 150, tpm: 2000000, weeklyBaselineLimit: 100 },
      ultra: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 350, tpm: 4000000, weeklyBaselineLimit: 100 },
      free: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 50, tpm: 500000, weeklyBaselineLimit: 100 }
    },
    defaultSimulatedUsage: 14.5,
    defaultSimulatedWeeklyUsage: 28.4
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
    workDoneWeight: 'Low',
    contextWindow: 1048576,
    maxOutputTokens: 32768,
    reasoning: false,
    multimodal: true,
    description: 'Shares Gemini Pool. Low compute cost variant for basic code edits and documentation.',
    quota: {
      pro: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 100, tpm: 1500000, weeklyBaselineLimit: 100 },
      ultra: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 250, tpm: 3500000, weeklyBaselineLimit: 100 },
      free: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 35, tpm: 400000, weeklyBaselineLimit: 100 }
    },
    defaultSimulatedUsage: 8.9,
    defaultSimulatedWeeklyUsage: 17.8
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
    workDoneWeight: 'Minimal',
    contextWindow: 1048576,
    maxOutputTokens: 32768,
    reasoning: false,
    multimodal: true,
    description: 'Shares Gemini Pool. Minimal Work Done draw for simple query answering.',
    quota: {
      pro: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 80, tpm: 1000000, weeklyBaselineLimit: 100 },
      ultra: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 180, tpm: 2500000, weeklyBaselineLimit: 100 },
      free: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 25, tpm: 250000, weeklyBaselineLimit: 100 }
    },
    defaultSimulatedUsage: 4.5,
    defaultSimulatedWeeklyUsage: 9.0
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
    workDoneWeight: 'High',
    contextWindow: 2097152,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares Gemini Pool. 2M context model with high Work Done compute cost. Autonomous subagent execution drains weekly baseline faster.',
    quota: {
      pro: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 60, tpm: 1000000, weeklyBaselineLimit: 100 },
      ultra: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 150, tpm: 3000000, weeklyBaselineLimit: 100 },
      free: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 20, tpm: 300000, weeklyBaselineLimit: 100 }
    },
    defaultSimulatedUsage: 31.0,
    defaultSimulatedWeeklyUsage: 82.4
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
    workDoneWeight: 'Medium',
    contextWindow: 2097152,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares Gemini Pool. 2M context model with moderate compute weight cost per reasoning prompt.',
    quota: {
      pro: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 40, tpm: 800000, weeklyBaselineLimit: 100 },
      ultra: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 100, tpm: 2000000, weeklyBaselineLimit: 100 },
      free: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 12, tpm: 200000, weeklyBaselineLimit: 100 }
    },
    defaultSimulatedUsage: 18.0,
    defaultSimulatedWeeklyUsage: 44.0
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
    workDoneWeight: 'High',
    contextWindow: 200000,
    maxOutputTokens: 32768,
    reasoning: true,
    multimodal: true,
    description: 'Shares Third-Party Pool. High Work Done compute cost. Exhausting quota directly reduces Claude Opus capacity.',
    quota: {
      pro: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 40, tpm: 600000, weeklyBaselineLimit: 100 },
      ultra: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 100, tpm: 2000000, weeklyBaselineLimit: 100 },
      free: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 15, tpm: 150000, weeklyBaselineLimit: 100 }
    },
    defaultSimulatedUsage: 65.0,
    defaultSimulatedWeeklyUsage: 80.6
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
    workDoneWeight: 'Extreme',
    contextWindow: 200000,
    maxOutputTokens: 32768,
    reasoning: true,
    multimodal: true,
    description: 'Shares Third-Party Pool. Extreme Work Done compute cost. Heavy multi-file refactoring or agentic loops rapidly consume weekly baseline.',
    quota: {
      pro: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 25, tpm: 400000, weeklyBaselineLimit: 100 },
      ultra: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 60, tpm: 1200000, weeklyBaselineLimit: 100 },
      free: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 10, tpm: 100000, weeklyBaselineLimit: 100 }
    },
    defaultSimulatedUsage: 95.0,
    defaultSimulatedWeeklyUsage: 100.0
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
    workDoneWeight: 'Medium',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    reasoning: true,
    multimodal: false,
    description: 'Shares OSS Pool. Moderate Work Done compute weight. High-speed open weights model for privacy-conscious agentic coding.',
    quota: {
      pro: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 80, tpm: 1000000, weeklyBaselineLimit: 100 },
      ultra: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 200, tpm: 3000000, weeklyBaselineLimit: 100 },
      free: { total: 100, resetHours: 5, resetDaysWeekly: 7, rpm: 30, tpm: 300000, weeklyBaselineLimit: 100 }
    },
    defaultSimulatedUsage: 44.0,
    defaultSimulatedWeeklyUsage: 66.0
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ANTIGRAVITY_PLANS, ANTIGRAVITY_MODELS };
}