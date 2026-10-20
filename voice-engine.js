/**
 * VITH Voice Engine
 * Handles Text-to-Speech (Fish Audio S2.1 Pro Free "Sarah" + Web Speech API fallback)
 * and Speech-to-Text (Web Speech API)
 */

const VITHVoice = {
  // ─── CONFIG ──────────────────────────────────────────────────────────────
  config: {
    fishAudio: {
      apiKey: "sk-fish-Ob7JINBI5EPoxos6h-rVa1gKjoHy9uReHh58Ku47ODk",
      voiceName: "Sarah",
      voiceId: "933563129e564b19a115bedd57b7406a", // Sarah voice model ID on fish.audio
      model: "s2.1-pro-free",                        // Free API tier model
      format: "mp3",
      endpoint: "https://api.fish.audio/v1/tts",
      proxyEndpoint: "/api/tts"
    },
    tts: {
      useFallback: false,
      rate: 1.05,
      pitch: 1.15,
      volume: 1.0,
      lang: "en-US",
      voice: null
    },
    stt: {
      lang: "en-US",
      continuous: true,
      interimResults: true
    }
  },

  // ─── STATE ────────────────────────────────────────────────────────────────
  isPlaying: false,
  isSpeaking: false,
  voiceEnabled: true,
  status: "ready", // ready | synthesizing | speaking | fallback | muted
  statusMessage: "Fish Audio S2.1 Pro Free (Sarah) Ready",
  audioQueue: [],
  currentAudio: null,
  currentAudioUrl: null,
  activeRequestId: 0,
  recognition: null,
  isListening: false,
  silenceTimer: null,          // Auto-submit after silence
  silenceDelay: 1800,          // ms of silence before auto-submit
  onSpeakStart: null,
  onSpeakEnd: null,
  onListenResult: null,
  onListenSubmit: null,        // Called when silence detected → auto submit
  onListenStart: null,
  onListenEnd: null,
  onError: null,
  onStatusChange: null,
  visualizerCallback: null,
  _audioCtx: null,
  _analyser: null,

  // ─── INIT ─────────────────────────────────────────────────────────────────
  async init() {
    // Load voice mute preference
    try {
      const saved = localStorage.getItem("vith_voice_enabled");
      if (saved !== null) {
        this.voiceEnabled = saved === "true";
      }
    } catch (e) {}

    this._initSTT();
    this._initWebSpeech();

    console.log(
      "%c[VITH Voice Engine: INIT]%c Fish Audio Sarah online with free tier model: " + this.config.fishAudio.model,
      "color: #00d4ff; font-weight: bold",
      "color: inherit"
    );

    this._setStatus(this.voiceEnabled ? "ready" : "muted", this.voiceEnabled ? "Fish Audio S2.1 Pro Free (Sarah) Ready" : "Voice output muted");

    return this;
  },

  setVoiceEnabled(enabled) {
    this.voiceEnabled = Boolean(enabled);
    try {
      localStorage.setItem("vith_voice_enabled", String(this.voiceEnabled));
    } catch (e) {}

    if (!this.voiceEnabled) {
      this.stopSpeaking();
      this._setStatus("muted", "Voice output muted");
    } else {
      this._setStatus("ready", "Fish Audio S2.1 Pro Free (Sarah) Ready");
    }
    return this.voiceEnabled;
  },

  toggleVoice() {
    return this.setVoiceEnabled(!this.voiceEnabled);
  },

  _setStatus(status, message = "") {
    this.status = status;
    this.statusMessage = message;
    console.log(`%c[VITH VOICE STATUS: ${status.toUpperCase()}]%c ${message}`, "color: #ffaa00; font-weight: bold", "color: inherit");
    if (this.onStatusChange) {
      try {
        this.onStatusChange(status, message);
      } catch (e) {
        console.warn("[VITH Voice] onStatusChange error:", e);
      }
    }
  },

  _initWebSpeech() {
    if ("speechSynthesis" in window) {
      const selectVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return;
        const preferred = voices.find(v =>
          v.name.includes("Microsoft Jenny Online (Natural)") ||
          v.name.includes("Microsoft Aria Online (Natural)") ||
          v.name.includes("Google US English") ||
          v.name.includes("Samantha") ||
          v.name.includes("Microsoft Zira") ||
          (v.lang.startsWith("en") && (v.name.toLowerCase().includes("female") || v.gender === "female"))
        );
        this.config.tts.voice = preferred || voices.find(v => v.lang.startsWith("en")) || voices[0];
      };

      selectVoice();
      window.speechSynthesis.onvoiceschanged = selectVoice;
    } else {
      console.warn("[VITH] Web Speech API not supported.");
    }
  },

  _initSTT() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("[VITH STT] Speech Recognition is NOT supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.config.stt.lang || "en-US";
    this.recognition.continuous = this.config.stt.continuous;
    this.recognition.interimResults = this.config.stt.interimResults;

    this.recognition.onaudiostart = () => {
      console.log("%c[VITH STT Event: onaudiostart]%c Mic capturing audio stream", "color: #00d4ff", "color: inherit");
    };

    this.recognition.onspeechstart = () => {
      console.log("%c[VITH STT Event: onspeechstart]%c Speech detected by recognizer", "color: #00ff88", "color: inherit");
    };

    this.recognition.onresult = (event) => {
      let fullTranscript = "";
      let hasInterim = false;

      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i];
        if (item && item[0]) {
          fullTranscript += item[0].transcript + " ";
          if (!item.isFinal) hasInterim = true;
        }
      }
      fullTranscript = fullTranscript.trim();

      if (this.onListenResult) {
        this.onListenResult(fullTranscript, !hasInterim);
      }

      clearTimeout(this.silenceTimer);
      if (fullTranscript.length > 0) {
        this.silenceTimer = setTimeout(() => {
          if (this.onListenSubmit) {
            this.onListenSubmit(fullTranscript);
          }
        }, this.silenceDelay);
      }
    };

    this.recognition.onend = () => {
      console.log("%c[VITH STT Event: onend]%c Recognition cycle ended", "color: #ffaa00", "color: inherit");
      this.isListening = false;
      if (this.onListenEnd) this.onListenEnd();
    };

    this.recognition.onerror = (e) => {
      console.warn(`[VITH STT Error] "${e.error}"`);
      this.isListening = false;
      if (e.error === "no-speech") return;
      if (e.error === "not-allowed" || e.error === "audio-capture") {
        if (this.onPermissionDenied) this.onPermissionDenied(e.error);
      } else {
        if (this.onError) this.onError(e);
      }
    };
  },

  // ─── TTS: SPEAK ───────────────────────────────────────────────────────────
  _preprocessSpeech(text) {
    if (!text) return "";
    return text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")  // Markdown links
      .replace(/https?:\/\/[^\s]+/g, "link")    // Raw URLs
      .replace(/```[\s\S]*?```/g, " ")          // Code blocks
      .replace(/`([^`]+)`/g, "$1")              // Inline code
      .replace(/[*#_~]/g, "")                   // Markdown symbols
      .replace(/\bVITH\b/g, "Vith")             // Spoken as single word
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
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  async speak(text) {
    if (!text || !this.voiceEnabled) {
      if (this.onSpeakEnd) this.onSpeakEnd();
      return;
    }

    // Stop active audio without premature onSpeakEnd
    this._stopActiveAudio();

    const processed = this._preprocessSpeech(text);
    if (!processed) {
      if (this.onSpeakEnd) this.onSpeakEnd();
      return;
    }

    const requestId = ++this.activeRequestId;
    this.isSpeaking = true;
    if (this.onSpeakStart) this.onSpeakStart();

    console.log(`%c[VITH Voice: speak]%c Request #${requestId}: "${processed.slice(0, 60)}..."`, "color: #00d4ff; font-weight: bold", "color: inherit");

    if (this.config.fishAudio.apiKey && !this.config.tts.useFallback) {
      await this._speakFishAudio(processed, requestId);
    } else {
      this._speakWebSpeech(processed, requestId);
    }
  },

  async _speakFishAudio(text, requestId) {
    const { apiKey, voiceId, model, format, endpoint, proxyEndpoint } = this.config.fishAudio;
    const payload = {
      text,
      reference_id: voiceId,
      model: model || "s2.1-pro-free",
      format: format || "mp3"
    };

    this._setStatus("synthesizing", "Generating Fish Audio voice (Sarah)...");

    try {
      let response = null;

      // 1. Try local proxy / Netlify serverless function first
      try {
        const proxyRes = await fetch(proxyEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (proxyRes.ok || proxyRes.status === 402 || proxyRes.status === 400) {
          response = proxyRes;
        }
      } catch (proxyErr) {
        // No local proxy available
      }

      // 2. Direct API request if proxy not reachable
      if (!response) {
        console.log("[VITH Fish Audio] Calling direct endpoint https://api.fish.audio/v1/tts...");
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "model": model || "s2.1-pro-free"
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[VITH Fish Audio] API returned HTTP ${response.status}: ${errText}`);
        throw new Error(`Fish Audio API returned ${response.status}`);
      }

      const blob = await response.blob();
      if (requestId !== this.activeRequestId) return;

      const url = URL.createObjectURL(blob);
      this.currentAudioUrl = url;
      const audio = new Audio(url);
      this.currentAudio = audio;

      // Drive visualizer via Web Audio API
      this._attachVisualizer(audio);

      audio.onplay = () => {
        if (requestId !== this.activeRequestId) {
          audio.pause();
          return;
        }
        this._setStatus("speaking", "Speaking (Fish Audio Sarah)");
      };

      audio.onended = () => {
        if (requestId === this.activeRequestId) {
          this._cleanupAudio();
          this.isSpeaking = false;
          this._setStatus("ready", "Voice ready");
          if (this.onSpeakEnd) this.onSpeakEnd();
        }
      };

      audio.onerror = (e) => {
        console.warn("[VITH Fish Audio] Audio playback error:", e);
        if (requestId === this.activeRequestId) {
          this._cleanupAudio();
          this._speakWebSpeech(text, requestId);
        }
      };

      await audio.play();
    } catch (err) {
      console.warn("[VITH Fish Audio] Switching to Web Speech fallback:", err.message);
      if (requestId !== this.activeRequestId) return;
      this._cleanupAudio();
      this._speakWebSpeech(text, requestId);
    }
  },

  _activeUtterance: null,
  _resumeInterval: null,

  _getBestVoice() {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    if (!voices || voices.length === 0) return null;
    const preferred = voices.find(v =>
      v.name.includes("Microsoft Jenny Online (Natural)") ||
      v.name.includes("Microsoft Aria Online (Natural)") ||
      v.name.includes("Google US English") ||
      v.name.includes("Samantha") ||
      (v.lang.startsWith("en") && (v.name.toLowerCase().includes("female") || v.gender === "female"))
    );
    return preferred || voices.find(v => v.lang.startsWith("en")) || voices[0];
  },

  _speakWebSpeech(text, requestId) {
    if (!window.speechSynthesis) {
      this.isSpeaking = false;
      this._setStatus("ready", "Voice ready");
      if (this.onSpeakEnd) this.onSpeakEnd();
      return;
    }

    this._setStatus("fallback", "Speaking via browser voice engine");

    const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    const bestVoice = this._getBestVoice();
    if (bestVoice) this.config.tts.voice = bestVoice;

    clearInterval(this._resumeInterval);
    this._resumeInterval = setInterval(() => {
      if (!this.isSpeaking) {
        clearInterval(this._resumeInterval);
        return;
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 3000);

    const chunks = this._chunkText(cleanText, 180);
    let i = 0;

    const speakNext = () => {
      if (i >= chunks.length || !this.isSpeaking || (requestId && requestId !== this.activeRequestId)) {
        this.isSpeaking = false;
        this._activeUtterance = null;
        clearInterval(this._resumeInterval);
        this._setStatus("ready", "Voice ready");
        if (this.onSpeakEnd) this.onSpeakEnd();
        return;
      }

      const chunk = chunks[i++];
      const utter = new SpeechSynthesisUtterance(chunk);
      this._activeUtterance = utter;

      if (!this.config.tts.voice) {
        this.config.tts.voice = this._getBestVoice();
      }
      if (this.config.tts.voice) utter.voice = this.config.tts.voice;

      utter.rate = this.config.tts.rate;
      utter.pitch = this.config.tts.pitch;
      utter.volume = this.config.tts.volume;
      utter.lang = this.config.tts.lang;

      utter.onend = () => {
        speakNext();
      };

      utter.onerror = (err) => {
        if (err.error === "canceled" || err.error === "interrupted") return;
        console.warn("[VITH TTS Error]", err);
        speakNext();
      };

      try { window.speechSynthesis.resume(); } catch (e) {}
      window.speechSynthesis.speak(utter);
      try { window.speechSynthesis.resume(); } catch (e) {}
    };

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      setTimeout(speakNext, 80);
    } else {
      setTimeout(speakNext, 25);
    }
  },

  _chunkText(text, maxLen = 200) {
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    const chunks = [];
    let current = "";
    for (const s of sentences) {
      if ((current + s).length > maxLen) {
        if (current) chunks.push(current.trim());
        current = s;
      } else {
        current += " " + s;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  },

  stopSpeaking() {
    this.activeRequestId++;
    clearInterval(this._resumeInterval);
    this._activeUtterance = null;
    const wasSpeaking = this.isSpeaking;

    this._stopActiveAudio();

    this.isSpeaking = false;
    this._setStatus(this.voiceEnabled ? "ready" : "muted", this.voiceEnabled ? "Voice ready" : "Voice output muted");

    if (wasSpeaking && this.onSpeakEnd) {
      this.onSpeakEnd();
    }
  },

  _stopActiveAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
    }
    this._cleanupAudio();

    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  },

  _cleanupAudio() {
    if (this.currentAudioUrl) {
      try { URL.revokeObjectURL(this.currentAudioUrl); } catch (e) {}
    }
    this.currentAudioUrl = null;
    this.currentAudio = null;
  },

  _attachVisualizer(audioElement) {
    if (!this.visualizerCallback) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this._audioCtx) {
        this._audioCtx = new AudioCtx();
        this._analyser = this._audioCtx.createAnalyser();
        this._analyser.fftSize = 256;
      }

      if (this._audioCtx.state === "suspended") {
        this._audioCtx.resume();
      }

      const source = this._audioCtx.createMediaElementSource(audioElement);
      source.connect(this._analyser);
      this._analyser.connect(this._audioCtx.destination);

      const bufferLength = this._analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const tick = () => {
        if (!this.currentAudio || this.currentAudio.paused) return;
        this._analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength / 255;
        if (this.visualizerCallback) this.visualizerCallback(avg);
        requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.warn("[VITH Audio Visualizer]", e.message);
    }
  },

  startListening() {
    console.log(`%c[VITH STT: startListening]%c isListening: ${this.isListening}`, "color: #00d4ff; font-weight: bold", "color: inherit");
    if (!this.recognition) return;
    if (this.isListening) return;
    if (this.isSpeaking) this.stopSpeaking();

    clearTimeout(this.silenceTimer);
    try {
      this.recognition.start();
      if (this.onPermissionGranted) this.onPermissionGranted();
    } catch (e) {
      if (e.name === "InvalidStateError") {
        this.isListening = true;
        if (this.onListenStart) this.onListenStart();
        return;
      }
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        if (this.onPermissionDenied) this.onPermissionDenied("not-allowed");
      } else {
        if (this.onError) this.onError(e);
      }
    }
  },

  stopListening() {
    clearTimeout(this.silenceTimer);
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {}
    this.isListening = false;
  }
};
