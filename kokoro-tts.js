/**
 * VITH Neural Voice System — Kokoro TTS via Hugging Face Cloud
 * Voice: af_heart (Friendly, intelligent, confident female AI assistant)
 * Engine: Hugging Face Spaces (hexgrad/Kokoro-TTS) with instant Natural Browser Voice Fallback
 * Zero client model download, zero client CPU strain, 100% free with zero API keys required.
 */

import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1.9.1/+esm";

class VITHNeuralTTS {
  constructor() {
    // Hugging Face Space configuration
    this.hfSpace = "hexgrad/Kokoro-TTS";
    this.voice = "af_heart";
    this.speed = 1.05;

    // Engine state
    this.client = null;
    this.status = "ready"; // ready | synthesizing | playing | fallback | muted | error
    this.statusMessage = "Kokoro Neural Voice (af_heart) Ready";
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
      voiceEnabled: this.voiceEnabled
    };
  }

  _setStatus(status, message = "") {
    this.status = status;
    this.statusMessage = message;
    if (this.onStatusChange) {
      try {
        this.onStatusChange(status, message);
      } catch (e) {
        console.warn("[VITH TTS] onStatusChange error:", e);
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
   * Preload connection to Hugging Face space in background
   */
  preload() {
    if (this.client || this.clientConnecting) return;
    this.clientConnecting = (async () => {
      try {
        console.log(`[VITH TTS] Preconnecting to Hugging Face Space: ${this.hfSpace}...`);
        this.client = await Client.connect(this.hfSpace);
        console.log("[VITH TTS] Hugging Face Kokoro connection established!");
      } catch (e) {
        console.warn("[VITH TTS] Preconnect note (will retry on speak):", e.message || e);
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
   * Synthesize and speak text using Kokoro af_heart via Hugging Face
   * Automatically falls back to high-quality browser speech if HF is asleep/slow (>3.5s).
   */
  async speak(text) {
    if (!text || !this.voiceEnabled) {
      if (this.onEnd) this.onEnd();
      return;
    }

    // Stop active audio without triggering onEnd callback
    this._stopActiveAudio();

    const speechText = this.preprocessText(text);
    if (!speechText) {
      if (this.onEnd) this.onEnd();
      return;
    }

    const requestId = ++this.activeRequestId;

    try {
      this._setStatus("synthesizing", "Generating Kokoro AI voice...");
      console.log(`[VITH TTS] Synthesizing with Kokoro af_heart: "${speechText.slice(0, 60)}..."`);

      // Attempt Hugging Face Kokoro synthesis with 3.5s timeout
      const audioUrl = await this._synthesizeWithTimeout(speechText, requestId, 3500);

      // Check if user clicked stop or asked another question while synthesizing
      if (requestId !== this.activeRequestId) return;

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
        this._setStatus("playing", "Speaking (Kokoro af_heart)");
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
          this._speakBrowserFallback(speechText, requestId);
        }
      };

      await audioEl.play();
    } catch (err) {
      console.warn("[VITH TTS] Hugging Face Kokoro unavailable or slow, falling back to browser natural voice:", err.message || err);
      if (requestId !== this.activeRequestId) return;
      this._cleanupAudio();
      this._speakBrowserFallback(speechText, requestId);
    }
  }

  /**
   * Synthesize with Hugging Face Space with an automatic safety timeout
   */
  async _synthesizeWithTimeout(text, requestId, timeoutMs = 3500) {
    const synthPromise = (async () => {
      if (!this.client) {
        this.client = await Client.connect(this.hfSpace);
      }

      if (requestId !== this.activeRequestId) {
        throw new Error("Request canceled");
      }

      // hexgrad/Kokoro-TTS Gradio interface: predict(0, [text, voice, speed])
      const result = await this.client.predict(0, [
        text,
        this.voice,
        this.speed
      ]);

      if (result && result.data && result.data[0]) {
        const item = result.data[0];
        const audioSrc = typeof item === "string" ? item : (item.url || item.path);
        if (audioSrc) return audioSrc;
      }

      throw new Error("Invalid output received from Hugging Face Kokoro");
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Hugging Face Kokoro response timed out")), timeoutMs)
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
   * Browser SpeechSynthesis Fallback if HF Space is asleep (>3.5s) or offline
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
