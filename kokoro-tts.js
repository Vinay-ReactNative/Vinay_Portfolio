/**
 * VITH Neural Voice System — Kokoro TTS via Hugging Face Cloud
 * Voice: af_heart (Friendly, intelligent, confident female AI assistant)
 * Engine: Hugging Face Spaces (hexgrad/Kokoro-TTS or custom space) with Natural Browser Voice Fallback
 * Zero client model download, zero client CPU strain, 100% free with zero API keys required.
 */

import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1.9.1/+esm";

class VITHNeuralTTS {
  constructor() {
    // Configurable Hugging Face Space or direct API URL
    this.hfSpace = localStorage.getItem("vith_hf_space") || "hexgrad/Kokoro-TTS";
    this.customApiUrl = localStorage.getItem("vith_custom_tts_url") || "";
    this.voice = "af_heart";
    this.speed = 1.05;
    this.timeoutMs = 12000; // 12 seconds to allow for public space queueing

    // Engine state
    this.client = null;
    this.status = "ready"; // ready | synthesizing | playing | fallback | muted | error
    this.statusMessage = "Kokoro Neural Voice Ready";
    this.clientConnecting = null;

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
    this.onStart = null;
    this.onEnd = null;
    this.onError = null;

    console.log(
      "%c[VITH TTS: INIT]%c Initialized with Space: " + this.hfSpace + (this.customApiUrl ? " | Custom API: " + this.customApiUrl : ""),
      "color: #00d4ff; font-weight: bold",
      "color: inherit"
    );
  }

  setSpace(spaceName) {
    if (!spaceName) return;
    this.hfSpace = spaceName.trim();
    this.client = null; // Reset client connection
    localStorage.setItem("vith_hf_space", this.hfSpace);
    console.log(`%c[VITH TTS: CONFIG]%c Updated Hugging Face Space to: ${this.hfSpace}`, "color: #00ff88; font-weight: bold", "color: inherit");
    this._setStatus("ready", `Configured with ${this.hfSpace}`);
  }

  setCustomApiUrl(url) {
    this.customApiUrl = (url || "").trim();
    localStorage.setItem("vith_custom_tts_url", this.customApiUrl);
    console.log(`%c[VITH TTS: CONFIG]%c Updated Custom TTS URL to: ${this.customApiUrl}`, "color: #00ff88; font-weight: bold", "color: inherit");
  }

  isReady() {
    return this.status !== "error" && this.voiceEnabled;
  }

  getStatus() {
    return {
      status: this.status,
      message: this.statusMessage,
      voice: this.voice,
      space: this.hfSpace,
      customApiUrl: this.customApiUrl,
      voiceEnabled: this.voiceEnabled
    };
  }

  _setStatus(status, message = "") {
    this.status = status;
    this.statusMessage = message;
    console.log(`%c[VITH TTS STATUS: ${status.toUpperCase()}]%c ${message}`, "color: #ffaa00; font-weight: bold", "color: inherit");
    if (this.onStatusChange) {
      try {
        this.onStatusChange(status, message);
      } catch (e) {
        console.warn("[VITH TTS] onStatusChange listener error:", e);
      }
    }
  }

  setVoiceEnabled(enabled) {
    this.voiceEnabled = Boolean(enabled);
    try {
      localStorage.setItem("vith_voice_enabled", String(this.voiceEnabled));
    } catch (e) {}

    if (!this.voiceEnabled) {
      this.stop();
      this._setStatus("muted", "Voice output muted");
    } else {
      this._setStatus("ready", `Voice ready (${this.voice} via HuggingFace)`);
    }
    return this.voiceEnabled;
  }

  toggleVoice() {
    return this.setVoiceEnabled(!this.voiceEnabled);
  }

  /**
   * Preconnect to Hugging Face space in background
   */
  async preload() {
    if (this.client || this.clientConnecting) return;
    this.clientConnecting = (async () => {
      try {
        console.log(`%c[VITH TTS: PRELOAD]%c Connecting to Space: ${this.hfSpace}...`, "color: #00d4ff", "color: inherit");
        this.client = await Client.connect(this.hfSpace);
        console.log(`%c[VITH TTS: PRELOAD]%c Connected successfully to Space: ${this.hfSpace}!`, "color: #00ff88; font-weight: bold", "color: inherit");
      } catch (e) {
        console.warn(`[VITH TTS: PRELOAD ERROR] Failed to preconnect to ${this.hfSpace}:`, e.message || e);
      } finally {
        this.clientConnecting = null;
      }
    })();
  }

  /**
   * Preprocess text for natural speech synthesis
   */
  preprocessText(rawText) {
    if (!rawText) return "";

    let t = String(rawText);

    // 1. Remove markdown links, keep label
    t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // 2. Remove raw URLs
    t = t.replace(/https?:\/\/[^\s]+/g, "link");

    // 3. Remove markdown headers, bold, italics, code fences
    t = t.replace(/```[\s\S]*?```/g, " ");
    t = t.replace(/`([^`]+)`/g, "$1");
    t = t.replace(/^#{1,6}\s+/gm, "");
    t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
    t = t.replace(/\*([^*]+)\*/g, "$1");
    t = t.replace(/__([^_]+)__/g, "$1");
    t = t.replace(/_([^_]+)_/g, "$1");
    t = t.replace(/^[•*▸-]\s+/gm, "");

    // 4. Remove HTML tags
    t = t.replace(/<[^>]*>/g, "");

    // 5. Phonetic adjustments & acronym pronunciations
    t = t.replace(/\bVITH\b/g, "Vith")
         .replace(/\bEDITH\b/g, "Edith")
         .replace(/\bVINXO\b/g, "Vinxo")
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
   * Main synthesis & speech router
   */
  async speak(text) {
    const logPrefix = `[VITH TTS ${new Date().toISOString().slice(11, 19)}]`;

    if (!text || !this.voiceEnabled) {
      console.log(`${logPrefix} Speak aborted: ${!text ? "Empty text" : "Voice muted"}`);
      if (this.onEnd) this.onEnd();
      return;
    }

    // Stop active audio without triggering premature onEnd
    this._stopActiveAudio();

    const speechText = this.preprocessText(text);
    if (!speechText) {
      if (this.onEnd) this.onEnd();
      return;
    }

    const requestId = ++this.activeRequestId;
    console.log(
      `%c${logPrefix} [REQUEST #${requestId}]%c Starting speech pipeline: "${speechText.slice(0, 60)}..."`,
      "color: #00d4ff; font-weight: bold",
      "color: inherit"
    );

    try {
      this._setStatus("synthesizing", "Requesting Kokoro AI voice...");

      // Attempt synthesis from Hugging Face or Custom API
      const audioUrl = await this._synthesizeWithTimeout(speechText, requestId, this.timeoutMs);

      // Check if user clicked stop or asked another question while synthesizing
      if (requestId !== this.activeRequestId) {
        console.warn(`${logPrefix} [REQUEST #${requestId}] Superseded by newer request #${this.activeRequestId}. Discarding audio.`);
        return;
      }

      console.log(
        `%c${logPrefix} [REQUEST #${requestId}] Audio URL received:%c ${audioUrl}`,
        "color: #00ff88; font-weight: bold",
        "color: #e0f8ff"
      );

      this.currentAudioUrl = audioUrl;
      const audioEl = new Audio(audioUrl);
      this.currentAudio = audioEl;

      // Connect Web Audio API analyser to drive visualizer
      this._attachVisualizer(audioEl);

      audioEl.onplay = () => {
        if (requestId !== this.activeRequestId) {
          audioEl.pause();
          return;
        }
        console.log(`%c${logPrefix} [REQUEST #${requestId}] Playback started (Kokoro ${this.voice})`, "color: #00ff88");
        this._setStatus("playing", "Speaking (Kokoro af_heart)");
        if (this.onStart) {
          try { this.onStart(); } catch (e) {}
        }
      };

      audioEl.onended = () => {
        console.log(`${logPrefix} [REQUEST #${requestId}] Playback completed.`);
        if (requestId === this.activeRequestId) {
          this._cleanupAudio();
          this._setStatus("ready", "Voice ready");
          if (this.onEnd) {
            try { this.onEnd(); } catch (e) {}
          }
        }
      };

      audioEl.onerror = (e) => {
        console.warn(`${logPrefix} [REQUEST #${requestId}] Audio element playback error:`, e);
        if (requestId === this.activeRequestId) {
          this._cleanupAudio();
          console.log(`${logPrefix} [REQUEST #${requestId}] Switching to browser speech fallback due to audio playback error.`);
          this._speakBrowserFallback(speechText, requestId);
        }
      };

      await audioEl.play();
    } catch (err) {
      console.warn(
        `%c${logPrefix} [REQUEST #${requestId}] Hugging Face Kokoro failed or timed out:%c ${err.message || err}`,
        "color: #ffaa00; font-weight: bold",
        "color: inherit"
      );
      if (err.stack) console.debug(err.stack);

      if (requestId !== this.activeRequestId) return;

      this._cleanupAudio();
      console.log(`%c${logPrefix} [REQUEST #${requestId}] Executing fallback: Browser SpeechSynthesis%c`, "color: #00d4ff; font-weight: bold", "color: inherit");
      this._speakBrowserFallback(speechText, requestId);
    }
  }

  /**
   * Synthesize with Hugging Face Space with an automatic safety timeout
   */
  async _synthesizeWithTimeout(text, requestId, timeoutMs = 12000) {
    const synthPromise = (async () => {
      // Branch 1: Direct Custom API URL if configured
      if (this.customApiUrl) {
        console.log(`[VITH TTS API] Fetching from Custom API: ${this.customApiUrl}...`);
        const res = await fetch(this.customApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: this.voice, speed: this.speed })
        });
        if (!res.ok) throw new Error(`Custom API returned HTTP ${res.status}: ${await res.text()}`);
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }

      // Branch 2: Hugging Face Space via Gradio Client
      console.log(`[VITH TTS HF] Connecting to Space "${this.hfSpace}"...`);
      if (!this.client) {
        this.client = await Client.connect(this.hfSpace);
        console.log(`[VITH TTS HF] Connected to "${this.hfSpace}". Inspecting available endpoints...`);
        try {
          const apiInfo = await this.client.view_api();
          console.log("[VITH TTS HF] Available endpoints on space:", apiInfo);
        } catch (infoErr) {
          console.log("[VITH TTS HF] Could not inspect endpoints schema:", infoErr.message);
        }
      }

      if (requestId !== this.activeRequestId) {
        throw new Error("Request canceled by user");
      }

      console.log(`[VITH TTS HF] Calling prediction endpoint on "${this.hfSpace}" with voice: ${this.voice}, text length: ${text.length}...`);

      let result = null;
      let lastErr = null;

      // Strategy 1: Try endpoint "/generate_first" with [text, voice, speed, use_gpu]
      try {
        result = await this.client.predict("/generate_first", [text, this.voice, this.speed, true]);
        console.log("[VITH TTS HF] /generate_first succeeded!", result);
      } catch (e1) {
        lastErr = e1;
        console.log("[VITH TTS HF] /generate_first failed, trying /generate:", e1.message);
      }

      // Strategy 2: Try endpoint "/generate" with [text, voice, speed]
      if (!result) {
        try {
          result = await this.client.predict("/generate", [text, this.voice, this.speed]);
          console.log("[VITH TTS HF] /generate succeeded!", result);
        } catch (e2) {
          lastErr = e2;
          console.log("[VITH TTS HF] /generate failed, trying default index 0:", e2.message);
        }
      }

      // Strategy 3: Try default prediction index 0 with [text, voice, speed]
      if (!result) {
        try {
          result = await this.client.predict(0, [text, this.voice, this.speed]);
          console.log("[VITH TTS HF] predict(0) succeeded!", result);
        } catch (e3) {
          lastErr = e3;
          console.log("[VITH TTS HF] predict(0) failed:", e3.message);
        }
      }

      if (result && result.data && result.data[0]) {
        const item = result.data[0];
        const audioSrc = typeof item === "string" ? item : (item.url || item.path);
        if (audioSrc) return audioSrc;
      }

      throw lastErr || new Error("Space returned empty or unparseable audio result");
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Hugging Face Space took > ${timeoutMs / 1000}s (Space is likely sleeping or queued)`)), timeoutMs)
    );

    return Promise.race([synthPromise, timeoutPromise]);
  }

  /**
   * Stop active audio internally without firing onEnd (used when starting new speech)
   */
  _stopActiveAudio() {
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
  }

  /**
   * Stop any active synthesis or playback immediately (user action: ⏹, Esc, Avatar Tap)
   */
  stop() {
    this.activeRequestId++; // Invalidate pending synthesis
    this._stopActiveAudio();
    this._setStatus(this.voiceEnabled ? "ready" : "muted", this.voiceEnabled ? "Voice ready" : "Voice output muted");

    if (this.onEnd) {
      try { this.onEnd(); } catch (e) {}
    }
  }

  _cleanupAudio() {
    if (this.currentAudioUrl && this.currentAudioUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(this.currentAudioUrl);
      } catch (e) {}
    }
    this.currentAudioUrl = null;
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
        const avg = sum / bufferLength / 255;
        if (this.visualizerCallback) {
          this.visualizerCallback(avg);
        }
        requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.warn("[VITH TTS] Audio visualizer connection note:", e.message);
    }
  }

  /**
   * Browser SpeechSynthesis Fallback
   */
  _speakBrowserFallback(text, requestId) {
    if (!("speechSynthesis" in window)) {
      if (this.onEnd) this.onEnd();
      return;
    }

    this._setStatus("fallback", "Speaking via browser voice engine");

    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.15;
    utterance.lang = "en-US";

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const preferred = voices.find(v =>
        v.name.includes("Microsoft Jenny Online (Natural)") ||
        v.name.includes("Microsoft Aria Online (Natural)") ||
        v.name.includes("Google US English") ||
        v.name.includes("Samantha") ||
        (v.lang.startsWith("en") && (v.name.toLowerCase().includes("female") || v.gender === "female"))
      ) || voices.find(v => v.lang.startsWith("en")) || voices[0];
      if (preferred) utterance.voice = preferred;
    }

    console.log(`[VITH TTS: FALLBACK] Voice selected: "${utterance.voice ? utterance.voice.name : "Default"}"`);

    utterance.onstart = () => {
      if (requestId !== this.activeRequestId) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
        return;
      }
      this._setStatus("playing", "Speaking (Browser Voice)");
      if (this.onStart) {
        try { this.onStart(); } catch (e) {}
      }
    };

    utterance.onend = () => {
      console.log(`[VITH TTS: FALLBACK] Finished speaking utterance.`);
      if (requestId === this.activeRequestId) {
        this._setStatus("ready", "Voice ready");
        if (this.onEnd) {
          try { this.onEnd(); } catch (e) {}
        }
      }
    };

    utterance.onerror = (err) => {
      if (err.error === "canceled" || err.error === "interrupted") return;
      console.warn("[VITH Browser TTS Error]", err);
      if (requestId === this.activeRequestId) {
        this._setStatus("ready", "Voice ready");
        if (this.onEnd) {
          try { this.onEnd(); } catch (e) {}
        }
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {
      console.warn("[VITH Browser TTS Exception]", e);
    }
  }
}

// Export singleton instance to window for global integration
const VITH_TTS = new VITHNeuralTTS();
if (typeof window !== "undefined") {
  window.VITH_TTS = VITH_TTS;
  window.dispatchEvent(new CustomEvent("vith-tts-ready", { detail: VITH_TTS }));
}
export default VITH_TTS;
