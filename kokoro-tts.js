/**
 * VITH Neural Voice System — Kokoro.js TTS Integration
 * Voice: af_heart (Friendly, intelligent, confident female AI assistant)
 * Model: onnx-community/Kokoro-82M-v1.0-ONNX (q8 precision, WebGPU with WASM fallback)
 */

import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";

class VITHNeuralTTS {
  constructor() {
    this.modelId = "onnx-community/Kokoro-82M-v1.0-ONNX";
    this.voice = "af_heart";
    this.dtype = "q8";

    // Engine state
    this.tts = null;
    this.status = "uninitialized"; // uninitialized | loading | ready | synthesizing | playing | error | fallback
    this.statusMessage = "Voice engine in standby";
    this.initPromise = null;
    this.device = null; // "webgpu" | "wasm"

    // Playback state
    this.currentAudio = null;
    this.currentAudioUrl = null;
    this.activeRequestId = 0;
    this.voiceEnabled = true;

    // Load voice mute preference from localStorage
    try {
      const saved = localStorage.getItem("vith_voice_enabled");
      if (saved !== null) {
        this.voiceEnabled = saved === "true";
      }
    } catch (e) {}

    // Web Audio visualizer setup
    this.audioCtx = null;
    this.analyser = null;
    this.visualizerCallback = null;

    // Callbacks
    this.onStatusChange = null;
    this.onProgress = null;
    this.onStart = null;
    this.onEnd = null;
    this.onError = null;
  }

  /**
   * Check if the neural model is loaded and ready
   */
  isReady() {
    return this.status === "ready" || (this.tts !== null && this.status !== "loading");
  }

  /**
   * Get current detailed status
   */
  getStatus() {
    return {
      status: this.status,
      message: this.statusMessage,
      voice: this.voice,
      device: this.device,
      model: this.modelId,
      voiceEnabled: this.voiceEnabled
    };
  }

  /**
   * Enable or disable voice synthesis output
   */
  setVoiceEnabled(enabled) {
    this.voiceEnabled = Boolean(enabled);
    try {
      localStorage.setItem("vith_voice_enabled", String(this.voiceEnabled));
    } catch (e) {}

    if (!this.voiceEnabled) {
      this.stop();
      this._setStatus("muted", "Voice output muted");
    } else {
      this._setStatus(
        this.isReady() ? "ready" : "uninitialized",
        this.isReady() ? `Voice ready (${this.voice} on ${this.device ? this.device.toUpperCase() : "standby"})` : "Voice engine in standby"
      );
    }
    return this.voiceEnabled;
  }

  /**
   * Toggle voice synthesis output on/off
   */
  toggleVoice() {
    return this.setVoiceEnabled(!this.voiceEnabled);
  }

  /**
   * Preload model in background without blocking initial page render
   */
  preload() {
    if (this.tts || this.initPromise) return;
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        this.initialize().catch(err => console.warn("[VITH TTS] Background preload note:", err.message));
      }, { timeout: 3500 });
    } else {
      setTimeout(() => {
        this.initialize().catch(err => console.warn("[VITH TTS] Background preload note:", err.message));
      }, 2000);
    }
  }

  /**
   * Update internal status and trigger listeners
   */
  _setStatus(status, message = "") {
    this.status = status;
    this.statusMessage = message;
    if (this.onStatusChange) {
      try {
        this.onStatusChange(status, message);
      } catch (e) {
        console.warn("[VITH TTS] onStatusChange callback error:", e);
      }
    }
  }

  /**
   * Initialize the Kokoro model once per session.
   * Handles WebGPU with automatic WASM fallback and progress tracking.
   */
  async initialize() {
    // If already ready, return existing instance
    if (this.tts) return this.tts;

    // Prevent duplicate simultaneous initializations
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this._setStatus("loading", "Preparing VITH's voice...");

      const progressCallback = (progress) => {
        if (!progress) return;
        let progressDetail = "";

        if (progress.status === "initiate") {
          progressDetail = `Downloading ${progress.file || "voice model"}...`;
          this._setStatus("loading", progressDetail);
        } else if (progress.status === "progress") {
          const pct = typeof progress.progress === "number" ? Math.round(progress.progress) : null;
          progressDetail = pct !== null
            ? `Downloading voice model: ${pct}%`
            : `Downloading voice model...`;
          this._setStatus("loading", progressDetail);
          if (this.onProgress) {
            try { this.onProgress(progress); } catch (e) {}
          }
        } else if (progress.status === "done") {
          progressDetail = `Loaded ${progress.file || "model chunk"}`;
          this._setStatus("loading", progressDetail);
        } else if (progress.status === "ready") {
          this._setStatus("loading", "Initializing speech engine...");
        }
      };

      // Preferred device: WebGPU with graceful fallback to WASM
      const hasWebGpu = typeof navigator !== "undefined" && Boolean(navigator.gpu);
      const preferredDevice = hasWebGpu ? "webgpu" : "wasm";

      console.log(`[VITH TTS] Initializing Kokoro TTS (Model: ${this.modelId}, dtype: ${this.dtype}, preferred device: ${preferredDevice})...`);

      try {
        // Attempt 1: WebGPU if available
        if (preferredDevice === "webgpu") {
          try {
            this.tts = await KokoroTTS.from_pretrained(this.modelId, {
              dtype: this.dtype,
              device: "webgpu",
              progress_callback: progressCallback
            });
            this.device = "webgpu";
            console.log("%c[VITH TTS]%c Successfully initialized on WebGPU!", "color: #00ff88; font-weight: bold", "color: inherit");
          } catch (gpuErr) {
            console.warn("[VITH TTS] WebGPU initialization failed, falling back to WASM:", gpuErr.message || gpuErr);
            this._setStatus("loading", "WebGPU unavailable, switching to WASM engine...");
          }
        }

        // Attempt 2: WASM fallback
        if (!this.tts) {
          this.tts = await KokoroTTS.from_pretrained(this.modelId, {
            dtype: this.dtype,
            device: "wasm",
            progress_callback: progressCallback
          });
          this.device = "wasm";
          console.log("%c[VITH TTS]%c Successfully initialized on WASM!", "color: #00d4ff; font-weight: bold", "color: inherit");
        }

        this._setStatus("ready", `Voice ready (af_heart on ${this.device.toUpperCase()})`);
        return this.tts;
      } catch (err) {
        console.error("[VITH TTS] Failed to initialize Kokoro TTS:", err);
        this.tts = null;
        this.initPromise = null;
        this._setStatus("error", "Neural voice unavailable. Falling back to browser speech.");
        if (this.onError) {
          try { this.onError(err); } catch (e) {}
        }
        throw err;
      }
    })();

    return this.initPromise;
  }

  /**
   * Preprocess text for natural speech synthesis
   * Strips markdown, URLs, code blocks, and phoneticizes acronyms.
   */
  preprocessText(rawText) {
    if (!rawText) return "";

    let t = String(rawText);

    // 1. Remove markdown links, keep label: [Vinay](https://...) -> Vinay
    t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // 2. Remove raw URLs
    t = t.replace(/https?:\/\/[^\s]+/g, "link");

    // 3. Remove markdown headers, bold, italics, code fences
    t = t.replace(/```[\s\S]*?```/g, " "); // code blocks
    t = t.replace(/`([^`]+)`/g, "$1");     // inline code
    t = t.replace(/^#{1,6}\s+/gm, "");     // headers
    t = t.replace(/\*\*([^*]+)\*\*/g, "$1"); // bold
    t = t.replace(/\*([^*]+)\*/g, "$1");     // italic
    t = t.replace(/__([^_]+)__/g, "$1");     // bold
    t = t.replace(/_([^_]+)_/g, "$1");       // italic
    t = t.replace(/^[•*▸-]\s+/gm, "");       // bullet points

    // 4. Remove HTML tags
    t = t.replace(/<[^>]*>/g, "");

    // 5. Phonetic adjustments & acronym pronunciations
    t = t.replace(/\bVITH\b/g, "Vith")          // Say "Vith" instead of V-I-T-H
         .replace(/\bEDITH\b/g, "Edith")        // Say "Edith"
         .replace(/\bVINXO\b/g, "Vinxo")        // Say "Vinxo"
         .replace(/\bWFM\b/g, "Workforce Management")
         .replace(/\bAI\b/g, "A.I.")
         .replace(/\bSTT\b/g, "Speech to Text")
         .replace(/\bTTS\b/g, "Text to Speech")
         .replace(/\bAPI\b/g, "A.P.I.")
         .replace(/\bAPIs\b/g, "A.P.I.s")
         .replace(/\bUI\b/g, "U.I.")
         .replace(/\bLLM\b/g, "L.L.M.")
         .replace(/\bLLMs\b/g, "L.L.M.s")
         .replace(/\bVAPT\b/g, "V.A.P.T.")
         .replace(/\bSSL\b/g, "S.S.L.")
         .replace(/\bCGPA\b/g, "C.G.P.A.")
         .replace(/\bQwen3\b/gi, "Qwen 3");

    // 6. Clean whitespace and newlines
    t = t.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();

    return t;
  }

  /**
   * Synthesize and speak text using Kokoro af_heart
   * Automatically interrupts any currently playing audio.
   */
  async speak(text) {
    if (!text || !this.voiceEnabled) {
      if (this.onEnd) this.onEnd();
      return;
    }

    // Stop active audio immediately
    this.stop();

    const speechText = this.preprocessText(text);
    if (!speechText) {
      if (this.onEnd) this.onEnd();
      return;
    }

    // Request ID token to prevent race conditions & out-of-order playback
    const requestId = ++this.activeRequestId;

    try {
      // Lazy load model if not yet loaded
      if (!this.tts) {
        await this.initialize();
      }

      // If a newer request was triggered while loading, cancel this one
      if (requestId !== this.activeRequestId) {
        return;
      }

      this._setStatus("synthesizing", "Synthesizing voice response...");
      console.log(`[VITH TTS] Synthesizing with af_heart (${this.device}): "${speechText.slice(0, 60)}..."`);

      const audioResult = await this.tts.generate(speechText, {
        voice: this.voice,
        speed: 1.05
      });

      // Stale check
      if (requestId !== this.activeRequestId) {
        return;
      }

      const audioBlob = audioResult.toBlob();
      const audioUrl = URL.createObjectURL(audioBlob);
      this.currentAudioUrl = audioUrl;

      const audioEl = new Audio(audioUrl);
      this.currentAudio = audioEl;

      // Connect Web Audio API analyser for visualizer
      this._attachVisualizer(audioEl);

      // Playback event hooks
      audioEl.onplay = () => {
        if (requestId !== this.activeRequestId) {
          audioEl.pause();
          return;
        }
        this._setStatus("playing", "Speaking response");
        if (this.onStart) {
          try { this.onStart(); } catch (e) {}
        }
      };

      audioEl.onended = () => {
        if (requestId === this.activeRequestId) {
          this._cleanupAudio();
          this._setStatus("ready", "Voice ready");
          if (this.onEnd) {
            try { this.onEnd(); } catch (e) {}
          }
        }
      };

      audioEl.onerror = (e) => {
        console.warn("[VITH TTS] Audio playback error:", e);
        if (requestId === this.activeRequestId) {
          this._cleanupAudio();
          this._setStatus("ready", "Voice ready");
          if (this.onEnd) {
            try { this.onEnd(); } catch (e) {}
          }
        }
      };

      await audioEl.play();
    } catch (err) {
      console.warn("[VITH TTS] Kokoro synthesis error:", err);
      // Stale request check
      if (requestId !== this.activeRequestId) return;

      this._cleanupAudio();

      // Graceful fallback to browser Web Speech API
      console.log("[VITH TTS] Falling back to Web Speech synthesis for response...");
      this._speakBrowserFallback(speechText, requestId);
    }
  }

  /**
   * Stop any active synthesis or audio playback immediately
   */
  stop() {
    this.activeRequestId++; // Invalidate pending synthesis

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
    }

    this._cleanupAudio();

    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    this._setStatus(this.tts ? "ready" : "uninitialized", this.tts ? "Voice ready" : "Voice engine in standby");

    if (this.onEnd) {
      try { this.onEnd(); } catch (e) {}
    }
  }

  /**
   * Clean up audio DOM elements & blob URLs
   */
  _cleanupAudio() {
    if (this.currentAudioUrl) {
      try {
        URL.revokeObjectURL(this.currentAudioUrl);
      } catch (e) {}
      this.currentAudioUrl = null;
    }
    this.currentAudio = null;
  }

  /**
   * Attach Web Audio API analyser to drive existing HUD waveform visualizer
   */
  _attachVisualizer(audioElement) {
    if (!this.visualizerCallback) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
      }

      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const source = this.audioCtx.createMediaElementSource(audioElement);
      source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const tick = () => {
        if (!this.currentAudio || this.currentAudio.paused) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength / 255; // 0 to 1
        if (this.visualizerCallback) {
          this.visualizerCallback(avg);
        }
        requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      // MediaElementAudioSource already connected or CORS warning
      console.warn("[VITH TTS] AudioContext visualizer connection note:", e.message);
    }
  }

  /**
   * Browser SpeechSynthesis Fallback if ONNX model download/execution fails
   */
  _speakBrowserFallback(text, requestId) {
    if (!("speechSynthesis" in window)) {
      if (this.onEnd) this.onEnd();
      return;
    }

    this._setStatus("fallback", "Speaking via browser speech engine");

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.15;
    utterance.lang = "en-US";

    // Select natural female voice if present
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes("Natural") ||
      v.name.includes("Jenny") ||
      v.name.includes("Aria") ||
      v.name.includes("Samantha") ||
      (v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => {
      if (requestId !== this.activeRequestId) {
        window.speechSynthesis.cancel();
        return;
      }
      if (this.onStart) {
        try { this.onStart(); } catch (e) {}
      }
    };

    utterance.onend = () => {
      if (requestId === this.activeRequestId) {
        this._setStatus("ready", "Voice ready");
        if (this.onEnd) {
          try { this.onEnd(); } catch (e) {}
        }
      }
    };

    utterance.onerror = () => {
      if (requestId === this.activeRequestId) {
        this._setStatus("ready", "Voice ready");
        if (this.onEnd) {
          try { this.onEnd(); } catch (e) {}
        }
      }
    };

    window.speechSynthesis.speak(utterance);
  }
}

// Export singleton instance to window for global integration
const VITH_TTS = new VITHNeuralTTS();
if (typeof window !== "undefined") {
  window.VITH_TTS = VITH_TTS;
  window.dispatchEvent(new CustomEvent("vith-tts-ready", { detail: VITH_TTS }));
}
export default VITH_TTS;
