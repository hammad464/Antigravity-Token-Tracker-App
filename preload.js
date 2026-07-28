const { contextBridge, ipcRenderer } = require('electron');

// Real BPE tokenizers (pure JS, no native/WASM deps) - replaces the old
// linear heuristic estimate ("words * 1.32 + symbols * 0.65 ...").
// cl100k_base = GPT-3.5 / GPT-4 family encoding.
// o200k_base  = GPT-4o / GPT-OSS family encoding.
// Neither Gemini nor Claude publish their exact BPE vocabularies, so these
// counts are used as a close, industry-standard approximation for ALL
// models here, not an exact count for Gemini/Claude specifically. The UI
// labels this clearly.
const cl100k = require('gpt-tokenizer/encoding/cl100k_base');
const o200k = require('gpt-tokenizer/encoding/o200k_base');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Returns real BPE token counts using two real OpenAI-family encodings.
  // This is an approximation for non-OpenAI models (Gemini, Claude) since
  // their tokenizers are not public - callers should present it as such.
  countTokens: (text) => {
    if (!text) return { cl100k: 0, o200k: 0 };
    try {
      return {
        cl100k: cl100k.countTokens(text),
        o200k: o200k.countTokens(text)
      };
    } catch (err) {
      // Fail closed with a clearly-flagged null rather than silently
      // falling back to a fake number.
      return { cl100k: null, o200k: null, error: String(err && err.message || err) };
    }
  }
});
