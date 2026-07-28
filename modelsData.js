/**
 * Antigravity Models & Quotas Reference Dataset
 * Authoritative specifications for Antigravity & Antigravity IDE subscription models.
 */

const ANTIGRAVITY_PLANS = {
  pro: {
    id: 'pro',
    name: 'Antigravity Pro',
    description: 'Standard paid plan with high throughput rolling quota limits',
    badge: 'PRO TIER'
  },
  ultra: {
    id: 'ultra',
    name: 'Antigravity Ultra / Enterprise',
    description: 'Maximum speed, prioritized thinking models, and 2.5x higher token limits',
    badge: 'ULTRA TIER'
  },
  free: {
    id: 'free',
    name: 'Antigravity Free / Community',
    description: 'Standard access with rate limits and 5-hour rolling reset schedules',
    badge: 'COMMUNITY'
  }
};

const ANTIGRAVITY_MODELS = [
  {
    id: 'gemini-3.6-flash-high',
    name: 'Gemini 3.6 Flash (High)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'High Quota',
    contextWindow: 1048576, // 1M tokens
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Flagship high-speed model with 1M context window and maximum parallel request capacity. Ideal for large context code parsing, multi-file refactoring, and complex pair programming.',
    quota: {
      pro: { total: 10000000, resetHours: 5, rpm: 150, tpm: 2000000 },
      ultra: { total: 25000000, resetHours: 5, rpm: 400, tpm: 5000000 },
      free: { total: 3000000, resetHours: 5, rpm: 60, tpm: 600000 }
    },
    defaultSimulatedUsage: 3420000
  },
  {
    id: 'gemini-3.6-flash-med',
    name: 'Gemini 3.6 Flash (Medium)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Medium Quota',
    contextWindow: 1048576,
    maxOutputTokens: 32768,
    reasoning: true,
    multimodal: true,
    description: 'Balanced throughput Gemini 3.6 Flash. Optimized for instant tab completions, automated code generation, and interactive chat loops.',
    quota: {
      pro: { total: 15000000, resetHours: 5, rpm: 200, tpm: 3000000 },
      ultra: { total: 35000000, resetHours: 5, rpm: 500, tpm: 7000000 },
      free: { total: 4500000, resetHours: 5, rpm: 80, tpm: 800000 }
    },
    defaultSimulatedUsage: 4100000
  },
  {
    id: 'gemini-3.6-flash-low',
    name: 'Gemini 3.6 Flash (Low)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Low Overhead',
    contextWindow: 1048576,
    maxOutputTokens: 16384,
    reasoning: false,
    multimodal: true,
    description: 'Ultra-lightweight Flash execution pool. High concurrency buffer for fast diagnostic checkups and inline code generation.',
    quota: {
      pro: { total: 20000000, resetHours: 5, rpm: 300, tpm: 4000000 },
      ultra: { total: 50000000, resetHours: 5, rpm: 750, tpm: 10000000 },
      free: { total: 6000000, resetHours: 5, rpm: 120, tpm: 1200000 }
    },
    defaultSimulatedUsage: 1200000
  },
  {
    id: 'gemini-3.5-flash-high',
    name: 'Gemini 3.5 Flash (High)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'High Quota',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    reasoning: false,
    multimodal: true,
    description: 'Previous-generation workhorse with high output depth. Proven reliability for large project indexing and file editing.',
    quota: {
      pro: { total: 12000000, resetHours: 5, rpm: 150, tpm: 2000000 },
      ultra: { total: 30000000, resetHours: 5, rpm: 400, tpm: 6000000 },
      free: { total: 4000000, resetHours: 5, rpm: 60, tpm: 700000 }
    },
    defaultSimulatedUsage: 8900000
  },
  {
    id: 'gemini-3.5-flash-med',
    name: 'Gemini 3.5 Flash (Medium)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Medium Quota',
    contextWindow: 1048576,
    maxOutputTokens: 32768,
    reasoning: false,
    multimodal: true,
    description: 'Fast response times for rapid question answering and repository search operations.',
    quota: {
      pro: { total: 16000000, resetHours: 5, rpm: 200, tpm: 3000000 },
      ultra: { total: 40000000, resetHours: 5, rpm: 500, tpm: 8000000 },
      free: { total: 5000000, resetHours: 5, rpm: 90, tpm: 900000 }
    },
    defaultSimulatedUsage: 2300000
  },
  {
    id: 'gemini-3.5-flash-low',
    name: 'Gemini 3.5 Flash (Low)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Low Overhead',
    contextWindow: 1048576,
    maxOutputTokens: 16384,
    reasoning: false,
    multimodal: true,
    description: 'High-availability fall-back tier for quick routine prompts.',
    quota: {
      pro: { total: 22000000, resetHours: 5, rpm: 300, tpm: 4500000 },
      ultra: { total: 55000000, resetHours: 5, rpm: 800, tpm: 12000000 },
      free: { total: 7000000, resetHours: 5, rpm: 120, tpm: 1500000 }
    },
    defaultSimulatedUsage: 500000
  },
  {
    id: 'gemini-3.1-pro-high',
    name: 'Gemini 3.1 Pro (High)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    speedBadge: 'Reasoning',
    speedClass: 'pro',
    variant: 'Deep Reasoning',
    contextWindow: 2097152, // 2M tokens
    maxOutputTokens: 65536,
    reasoning: true,
    multimodal: true,
    description: 'Massive 2 Million token context window with deep architectural reasoning capabilities. Specialized for full repository analysis, legacy code conversion, and multi-agent coordination.',
    quota: {
      pro: { total: 5000000, resetHours: 5, rpm: 60, tpm: 1000000 },
      ultra: { total: 15000000, resetHours: 5, rpm: 150, tpm: 3000000 },
      free: { total: 1500000, resetHours: 5, rpm: 20, tpm: 300000 }
    },
    defaultSimulatedUsage: 3100000
  },
  {
    id: 'gemini-3.1-pro-low',
    name: 'Gemini 3.1 Pro (Low)',
    provider: 'Google Gemini',
    providerKey: 'gemini',
    speedBadge: 'Standard',
    speedClass: 'pro',
    variant: 'Standard Pro',
    contextWindow: 2097152,
    maxOutputTokens: 16384,
    reasoning: true,
    multimodal: true,
    description: 'Standard 2M context Pro model with moderate output quota for balanced deep reasoning.',
    quota: {
      pro: { total: 8000000, resetHours: 5, rpm: 90, tpm: 1500000 },
      ultra: { total: 20000000, resetHours: 5, rpm: 200, tpm: 4000000 },
      free: { total: 2000000, resetHours: 5, rpm: 30, tpm: 400000 }
    },
    defaultSimulatedUsage: 1400000
  },
  {
    id: 'claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6 (Thinking)',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    speedBadge: 'Thinking',
    speedClass: 'thinking',
    variant: 'Extended Thinking',
    contextWindow: 200000,
    maxOutputTokens: 32768,
    reasoning: true,
    multimodal: true,
    description: 'Anthropic Sonnet 4.6 with visible thinking step capabilities. Outstanding for algorithmic logic, precise refactoring, complex bug detection, and mathematical derivations.',
    quota: {
      pro: { total: 3000000, resetHours: 5, rpm: 40, tpm: 600000 },
      ultra: { total: 10000000, resetHours: 5, rpm: 100, tpm: 2000000 },
      free: { total: 800000, resetHours: 5, rpm: 15, tpm: 150000 }
    },
    defaultSimulatedUsage: 1950000
  },
  {
    id: 'claude-opus-4.6',
    name: 'Claude Opus 4.6 (Thinking)',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    speedBadge: 'Thinking',
    speedClass: 'thinking',
    variant: 'Deep Synthesis',
    contextWindow: 200000,
    maxOutputTokens: 32768,
    reasoning: true,
    multimodal: true,
    description: 'The pinnacle of complex problem-solving. Deepest cognitive reasoning budget for critical system architecture design and complex edge-case debugging.',
    quota: {
      pro: { total: 1500000, resetHours: 5, rpm: 25, tpm: 400000 },
      ultra: { total: 5000000, resetHours: 5, rpm: 60, tpm: 1200000 },
      free: { total: 400000, resetHours: 5, rpm: 10, tpm: 100000 }
    },
    defaultSimulatedUsage: 1120000
  },
  {
    id: 'gpt-oss-120b',
    name: 'GPT-OSS 120B (Medium)',
    provider: 'Open Source',
    providerKey: 'opensource',
    speedBadge: 'Fast',
    speedClass: 'fast',
    variant: 'Open Weights 120B',
    contextWindow: 131072, // 128k
    maxOutputTokens: 16384,
    reasoning: false,
    multimodal: false,
    description: 'State-of-the-art open-weights 120 Billion parameter model hosted on dedicated high-throughput infrastructure. Ideal for fast localized edits and low latency generation.',
    quota: {
      pro: { total: 12000000, resetHours: 5, rpm: 180, tpm: 2500000 },
      ultra: { total: 30000000, resetHours: 5, rpm: 450, tpm: 6000000 },
      free: { total: 3500000, resetHours: 5, rpm: 50, tpm: 500000 }
    },
    defaultSimulatedUsage: 2100000
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ANTIGRAVITY_PLANS, ANTIGRAVITY_MODELS };
}
