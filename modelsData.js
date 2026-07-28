/**
 * Antigravity Models & Quotas Reference Dataset
 * 100% Aligned with Official Antigravity IDE Settings Screen (image_00a58d.png).
 * Models share 2 official groups: 'gemini_models' and 'claude_gpt_models'.
 *
 * NOTE: usage percentages/timers are NOT stored here. They live once per
 * shared pool (see GROUP_STATE in renderer.js), because every model in a
 * pool genuinely shares one 5-hour limit and one weekly limit - giving each
 * model its own independent fake percentage, as the previous version did,
 * contradicted that and was misleading.
 */

const ANTIGRAVITY_PLANS = {
  pro: {
    id: 'pro',
    name: 'Antigravity Pro',
    description: 'Priority access with 5-hour rolling sprints and a rolling weekly baseline limit',
    badge: 'PRO TIER',
    weeklyBaseline: 'Rolling weekly limit tied directly to your tier. Quota is consumed proportionally to token cost.'
  },
  ultra: {
    id: 'ultra',
    name: 'Antigravity Ultra / Enterprise',
    description: 'Maximum speed, prioritized thinking models, and 2.5x higher weekly baseline limits',
    badge: 'ULTRA TIER',
    weeklyBaseline: '2.5× higher rolling weekly limit for high-volume enterprise subagent workloads.'
  },
  free: {
    id: 'free',
    name: 'Antigravity Free / Community',
    description: 'Standard access with rate limits, 5-hour rolling windows, and low weekly caps',
    badge: 'COMMUNITY',
    weeklyBaseline: 'Standard rolling weekly limit with lower aggregate capacity.'
  }
};

const ANTIGRAVITY_MODELS = [
  {
    id: 'gemini-3.6-flash-high',
    name: 'Gemini 3.6 Flash (High)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_models',
    poolDisplayName: 'Gemini Models',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'High Throughput',
    workDoneWeight: 'Low',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares Gemini Models pool. Low compute cost per prompt. High-speed model ideal for rapid code parsing.',
    quota: {
      pro: { total: 100, resetHours: 5, rpm: 150, tpm: 2000000 },
      ultra: { total: 100, resetHours: 5, rpm: 400, tpm: 5000000 },
      free: { total: 100, resetHours: 5, rpm: 60, tpm: 600000 }
    }
  },
  {
    id: 'gemini-3.6-flash-med',
    name: 'Gemini 3.6 Flash (Medium)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_models',
    poolDisplayName: 'Gemini Models',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Balanced Speed',
    workDoneWeight: 'Low',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares Gemini Models pool. Medium throughput variant optimized for general agentic pair-programming tasks.',
    quota: {
      pro: { total: 100, resetHours: 5, rpm: 120, tpm: 1800000 },
      ultra: { total: 100, resetHours: 5, rpm: 300, tpm: 4500000 },
      free: { total: 100, resetHours: 5, rpm: 45, tpm: 500000 }
    }
  },
  {
    id: 'gemini-3.6-flash-low',
    name: 'Gemini 3.6 Flash (Low)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_models',
    poolDisplayName: 'Gemini Models',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Standard',
    workDoneWeight: 'Minimal',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares Gemini Models pool. Economical choice for quick inline completions and single-file edits.',
    quota: {
      pro: { total: 100, resetHours: 5, rpm: 90, tpm: 1200000 },
      ultra: { total: 100, resetHours: 5, rpm: 200, tpm: 3000000 },
      free: { total: 100, resetHours: 5, rpm: 30, tpm: 350000 }
    }
  },
  {
    id: 'gemini-3.5-flash-high',
    name: 'Gemini 3.5 Flash (High)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_models',
    poolDisplayName: 'Gemini Models',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'High Speed',
    workDoneWeight: 'Low',
    contextWindow: 1048576,
    maxOutputTokens: 32768,
    reasoning: false,
    multimodal: true,
    description: 'Shares Gemini Models pool. Ultra-fast non-reasoning model with low compute drain.',
    quota: {
      pro: { total: 100, resetHours: 5, rpm: 150, tpm: 2000000 },
      ultra: { total: 100, resetHours: 5, rpm: 350, tpm: 4000000 },
      free: { total: 100, resetHours: 5, rpm: 50, tpm: 500000 }
    }
  },
  {
    id: 'gemini-3.5-flash-med',
    name: 'Gemini 3.5 Flash (Medium)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_models',
    poolDisplayName: 'Gemini Models',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Balanced',
    workDoneWeight: 'Low',
    contextWindow: 1048576,
    maxOutputTokens: 32768,
    reasoning: false,
    multimodal: true,
    description: 'Shares Gemini Models pool. Low compute cost variant for basic code edits and documentation.',
    quota: {
      pro: { total: 100, resetHours: 5, rpm: 100, tpm: 1500000 },
      ultra: { total: 100, resetHours: 5, rpm: 250, tpm: 3500000 },
      free: { total: 100, resetHours: 5, rpm: 35, tpm: 400000 }
    }
  },
  {
    id: 'gemini-3.5-flash-low',
    name: 'Gemini 3.5 Flash (Low)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_models',
    poolDisplayName: 'Gemini Models',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Lightweight',
    workDoneWeight: 'Minimal',
    contextWindow: 1048576,
    maxOutputTokens: 32768,
    reasoning: false,
    multimodal: true,
    description: 'Shares Gemini Models pool. Minimal Work Done draw for simple query answering.',
    quota: {
      pro: { total: 100, resetHours: 5, rpm: 80, tpm: 1000000 },
      ultra: { total: 100, resetHours: 5, rpm: 180, tpm: 2500000 },
      free: { total: 100, resetHours: 5, rpm: 25, tpm: 250000 }
    }
  },
  {
    id: 'gemini-3.1-pro-high',
    name: 'Gemini 3.1 Pro (High)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_models',
    poolDisplayName: 'Gemini Models',
    speedBadge: 'Reasoning',
    speedClass: 'pro',
    variant: 'Deep Reasoning',
    workDoneWeight: 'High',
    contextWindow: 2097152,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares Gemini Models pool. 2M context model with high reasoning capability.',
    quota: {
      pro: { total: 100, resetHours: 5, rpm: 60, tpm: 1000000 },
      ultra: { total: 100, resetHours: 5, rpm: 150, tpm: 3000000 },
      free: { total: 100, resetHours: 5, rpm: 20, tpm: 300000 }
    }
  },
  {
    id: 'gemini-3.1-pro-low',
    name: 'Gemini 3.1 Pro (Low)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    sharedPool: 'gemini_models',
    poolDisplayName: 'Gemini Models',
    speedBadge: 'Reasoning',
    speedClass: 'pro',
    variant: 'Standard Pro',
    workDoneWeight: 'Medium',
    contextWindow: 2097152,
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Shares Gemini Models pool. 2M context model with standard reasoning limits.',
    quota: {
      pro: { total: 100, resetHours: 5, rpm: 40, tpm: 800000 },
      ultra: { total: 100, resetHours: 5, rpm: 100, tpm: 2000000 },
      free: { total: 100, resetHours: 5, rpm: 12, tpm: 200000 }
    }
  },
  {
    id: 'claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6 (Thinking)',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    sharedPool: 'claude_gpt_models',
    poolDisplayName: 'Claude and GPT models',
    speedBadge: 'Thinking',
    speedClass: 'thinking',
    variant: 'Extended Thinking',
    workDoneWeight: 'High',
    contextWindow: 200000,
    maxOutputTokens: 32768,
    reasoning: true,
    multimodal: true,
    description: 'Shares Claude and GPT models pool. Exhausting 5-hour limit temporarily restricts all models in this group.',
    quota: {
      pro: { total: 100, resetHours: 5, rpm: 40, tpm: 600000 },
      ultra: { total: 100, resetHours: 5, rpm: 100, tpm: 2000000 },
      free: { total: 100, resetHours: 5, rpm: 15, tpm: 150000 }
    }
  },
  {
    id: 'claude-opus-4.6',
    name: 'Claude Opus 4.6 (Thinking)',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    sharedPool: 'claude_gpt_models',
    poolDisplayName: 'Claude and GPT models',
    speedBadge: 'Thinking',
    speedClass: 'thinking',
    variant: 'Deep Synthesis',
    workDoneWeight: 'Extreme',
    contextWindow: 200000,
    maxOutputTokens: 32768,
    reasoning: true,
    multimodal: true,
    description: 'Shares Claude and GPT models pool. Deep cognitive model. High consumption impacts Claude & GPT quota.',
    quota: {
      pro: { total: 100, resetHours: 5, rpm: 25, tpm: 400000 },
      ultra: { total: 100, resetHours: 5, rpm: 60, tpm: 1200000 },
      free: { total: 100, resetHours: 5, rpm: 10, tpm: 100000 }
    }
  },
  {
    id: 'gpt-oss-120b-med',
    name: 'GPT-OSS 120B (Medium)',
    provider: 'Open Source',
    providerKey: 'oss',
    sharedPool: 'claude_gpt_models',
    poolDisplayName: 'Claude and GPT models',
    speedBadge: 'Open Source',
    speedClass: 'fast',
    variant: 'Medium Weights',
    workDoneWeight: 'Medium',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    reasoning: true,
    multimodal: false,
    description: 'Shares Claude and GPT models pool alongside Anthropic Claude models.',
    quota: {
      pro: { total: 100, resetHours: 5, rpm: 80, tpm: 1000000 },
      ultra: { total: 100, resetHours: 5, rpm: 200, tpm: 3000000 },
      free: { total: 100, resetHours: 5, rpm: 30, tpm: 300000 }
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ANTIGRAVITY_PLANS, ANTIGRAVITY_MODELS };
}