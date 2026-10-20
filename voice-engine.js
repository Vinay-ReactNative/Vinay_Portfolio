/**
 * VITH Voice Engine
 * Handles Text-to-Speech (Fish Audio "Sarah" + Web Speech API fallback)
 * and Speech-to-Text (Web Speech API)
 */

const VITHVoice = {
  // ─── CONFIG ──────────────────────────────────────────────────────────────
  config: {
    fishAudio: {
      apiKey: "sk-fish-Ob7JINBI5EPoxos6h-rVa1gKjoHy9uReHh58Ku47ODk",
      voiceName: "Sarah",
      voiceId: "933563129e564b19a115bedd57b7406a", // Sarah voice model ID on fish.audio
      model: "s2.1-pro",
      format: "mp3",
      endpoint: "https://api.fish.audio/v1/tts",
      proxyEndpoint: "/api/tts"
    },
    tts: {
      useFallback: false, // Tries Fish Audio first; seamlessly falls back if credit exhausted or offline
      rate: 1.05,         // Slightly faster = more energetic/youthful
      pitch: 1.15,        // Higher pitch = female, friendly tone
      volume: 1.0,
      lang: "en-US",
      voice: null // Will be auto-selected
    },
    stt: {
      lang: "en-US",
      continuous: true,       // Keep listening until user stops
      interimResults: true    // Show words as they appear in real time
    }
  },

  // ─── STATE ────────────────────────────────────────────────────────────────
  isPlaying: false,
  isSpeaking: false,
  audioQueue: [],
  currentAudio: null,
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
  visualizerCallback: null,

  // ─── INIT ─────────────────────────────────────────────────────────────────
  async init() {
    this._initSTT();
    this._initWebSpeech();
    if (!this.config.fishAudio.apiKey) {
      console.log("[VITH] Fish Audio API key not set. Using Web Speech API.");
      this.config.tts.useFallback = true;
    } else {
      console.log("[VITH] Fish Audio initialized with voice Sarah (reference_id: " + this.config.fishAudio.voiceId + ")");
    }
    return this;
  },

  _initWebSpeech() {
    if ("speechSynthesis" in window) {
      const selectVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return;
        // Prefer young, friendly, natural female voices (priority order)
        const preferred = voices.find(v =>
          v.name.includes("Microsoft Jenny Online (Natural)") || // Edge neural young female
          v.name.includes("Microsoft Aria Online (Natural)") ||  // Edge neural female
          v.name.includes("Google US English") ||                // Chrome female default
          v.name.includes("Samantha") ||                         // macOS natural female
          v.name.includes("Microsoft Zira") ||                   // Windows standard female
          v.name.includes("Karen") ||                            // macOS female
          v.name.includes("Victoria") ||                         // macOS female
          v.name.includes("Moira") ||                            // macOS Irish female
          (v.lang.startsWith("en") && (v.name.toLowerCase().includes("female") || v.gender === "female"))
        );
        // Fallback: any English voice
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
      console.warn("[VITH STT] Speech Recognition is NOT supported in this browser (SpeechRecognition & webkitSpeechRecognition undefined).");
      return;
    }
    console.log("[VITH STT: _initSTT] SpeechRecognition supported. Creating instance with:", {
      lang: this.config.stt.lang || "en-US",
      continuous: this.config.stt.continuous,
      interimResults: this.config.stt.interimResults
    });

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.config.stt.lang || "en-US";
    this.recognition.continuous = this.config.stt.continuous;
    this.recognition.interimResults = this.config.stt.interimResults;

    this.recognition.onaudiostart = () => {
      console.log("%c[VITH STT Event: onaudiostart]%c Audio hardware capture started (mic is receiving sound stream)", "color: #00d4ff; font-weight: bold", "color: inherit");
    };

    this.recognition.onsoundstart = () => {
      console.log("%c[VITH STT Event: onsoundstart]%c Sound waveform detected in microphone audio stream", "color: #ffaa00; font-weight: bold", "color: inherit");
    };

    this.recognition.onspeechstart = () => {
      console.log("%c[VITH STT Event: onspeechstart]%c Speech pattern detected by speech recognizer!", "color: #00ff88; font-weight: bold", "color: inherit");
    };

    this.recognition.onresult = (event) => {
      let fullTranscript = "";
      let hasInterim = false;
      const details = [];

      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i];
        if (item && item[0]) {
          const t = item[0].transcript;
          fullTranscript += t + " ";
          if (!item.isFinal) hasInterim = true;
          details.push({ index: i, transcript: t, isFinal: item.isFinal, confidence: item[0].confidence });
        }
      }
      fullTranscript = fullTranscript.trim();

      console.log(
        `%c[VITH STT Event: onresult]%c "${fullTranscript}" (isFinal: ${!hasInterim})`,
        "color: #00d4ff; font-weight: bold",
        "color: #e0f8ff",
        details
      );

      // Send current live transcript to UI
      if (this.onListenResult && fullTranscript) {
        this.onListenResult(fullTranscript, !hasInterim);
      }

      // Reset silence timer on every new word or sound
      clearTimeout(this.silenceTimer);

      // Auto-submit after silence
      if (fullTranscript) {
        console.log(`[VITH STT] Silence timer armed for ${this.silenceDelay}ms...`);
        this.silenceTimer = setTimeout(() => {
          console.log("%c[VITH STT]%c Silence timer expired! Auto-submitting:", "color: #ffaa00; font-weight: bold", "color: inherit", fullTranscript);
          if (this.onListenSubmit) {
            this.onListenSubmit(fullTranscript);
          }
        }, this.silenceDelay);
      }
    };

    this.recognition.onspeechend = () => {
      console.log("[VITH STT Event: onspeechend] User finished speaking utterance.");
    };

    this.recognition.onsoundend = () => {
      console.log("[VITH STT Event: onsoundend] Sound input stopped.");
    };

    this.recognition.onaudioend = () => {
      console.log("[VITH STT Event: onaudioend] Audio hardware stream closed.");
    };

    this.recognition.onnomatch = () => {
      console.warn("[VITH STT Event: onnomatch] Speech was heard but could not be parsed into words.");
    };

    this.recognition.onstart = () => {
      console.log("%c[VITH STT Event: onstart]%c SpeechRecognition session is ONLINE and actively listening.", "color: #00ff88; font-weight: bold", "color: inherit");
      this.isListening = true;
      if (this.onListenStart) this.onListenStart();
    };

    this.recognition.onend = () => {
      console.log("%c[VITH STT Event: onend]%c SpeechRecognition session has closed.", "color: #ffaa00; font-weight: bold", "color: inherit");
      this.isListening = false;
      if (this.onListenEnd) this.onListenEnd();
    };

    this.recognition.onerror = (e) => {
      console.warn(
        `%c[VITH STT Event: onerror]%c Error: "${e.error}" | Message: "${e.message || "none"}"`,
        "color: #ff3333; font-weight: bold",
        "color: inherit"
      );
      this.isListening = false;
      if (e.error === "no-speech") {
        console.log("[VITH STT] 'no-speech' error: No audible voice detected during timeout window.");
        return;
      }
      if (e.error === "not-allowed" || e.error === "audio-capture") {
        if (this.onPermissionDenied) this.onPermissionDenied(e.error);
      } else {
        if (this.onError) this.onError(e);
      }
    };
  },

  // ─── TTS: SPEAK ───────────────────────────────────────────────────────────

  // Fix pronunciation: "VITH" all-caps gets spelled out by TTS engines.
  // Replace with "Vith" so it's read as a single word, like EDITH → Edith.
  _preprocessSpeech(text) {
    return text
      .replace(/\bVITH\b/g, "Vith")   // VITH → Vith (spoken as one word)
      .replace(/\bEDITH\b/g, "Edith") // EDITH → Edith
      .replace(/\bAI\b/g, "A.I.");    // AI → A.I. (sounds more natural)
  },

  async speak(text) {
    if (!text) return;
    this.stopSpeaking();
    const processed = this._preprocessSpeech(text);

    if (this.onSpeakStart) this.onSpeakStart();
    this.isSpeaking = true;

    if (this.config.fishAudio.apiKey && !this.config.tts.useFallback) {
      await this._speakFishAudio(processed);
    } else {
      this._speakWebSpeech(processed);
    }
  },

  async _speakFishAudio(text) {
    const { apiKey, voiceId, model, format, endpoint, proxyEndpoint } = this.config.fishAudio;
    const payload = {
      text,
      reference_id: voiceId,
      format: format || "mp3"
    };

    try {
      let response;
      // 1. Try local proxy if running
      try {
        const proxyRes = await fetch(proxyEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (proxyRes.ok || proxyRes.status !== 404) {
          response = proxyRes;
        }
      } catch (proxyErr) {
        // No local proxy, continue to direct endpoint
      }

      // 2. Direct API request
      if (!response) {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "model": model || "s2.1-pro"
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        if (response.status === 402) {
          console.warn(
            "[VITH Fish Audio] Insufficient API credit (HTTP 402). Top up API credits at https://fish.audio/app/developers. Seamlessly using natural Web Speech engine."
          );
        } else {
          console.warn(`[VITH Fish Audio] API returned HTTP ${response.status}: ${response.statusText}. Using Web Speech fallback.`);
        }
        throw new Error(`Fish Audio API error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.currentAudio = audio;

      // Wire up visualizer
      if (this.visualizerCallback) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const source = ctx.createMediaElementSource(audio);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyser.connect(ctx.destination);
            this._driveVisualizer(analyser);
          }
        } catch (visErr) {
          console.warn("[VITH Audio Visualizer]", visErr);
        }
      }

      audio.onended = () => {
        this.isSpeaking = false;
        URL.revokeObjectURL(url);
        if (this.onSpeakEnd) this.onSpeakEnd();
      };

      audio.onerror = (err) => {
        console.warn("[VITH Fish Audio] Audio element playback error, falling back to Web Speech:", err);
        this.isSpeaking = false;
        URL.revokeObjectURL(url);
        this._speakWebSpeech(text);
      };

      await audio.play();
    } catch (err) {
      console.warn("[VITH Fish Audio] Falling back to Web Speech synthesis:", err.message);
      this._speakWebSpeech(text);
    }
  },

  _activeUtterance: null,
  _resumeInterval: null,

  _getBestVoice() {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    if (!voices || voices.length === 0) return null;
    const preferred = voices.find(v =>
      v.name.includes("Microsoft Jenny Online (Natural)") || // Edge natural female
      v.name.includes("Microsoft Aria Online (Natural)") ||  // Edge natural female
      v.name.includes("Google US English") ||                // Chrome female default
      v.name.includes("Samantha") ||                         // macOS female
      v.name.includes("Microsoft Zira") ||                   // Windows female
      v.name.includes("Karen") ||                            // macOS female
      v.name.includes("Victoria") ||                         // macOS female
      v.name.includes("Moira") ||                            // macOS Irish female
      (v.lang.startsWith("en") && (v.name.toLowerCase().includes("female") || v.gender === "female"))
    );
    return preferred || voices.find(v => v.lang.startsWith("en")) || voices[0];
  },

  _speakWebSpeech(text) {
    if (!window.speechSynthesis) {
      this.isSpeaking = false;
      if (this.onSpeakEnd) this.onSpeakEnd();
      return;
    }

    // Clean whitespace and linebreaks for natural speech flow
    const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    // Pick best voice
    const bestVoice = this._getBestVoice();
    if (bestVoice) this.config.tts.voice = bestVoice;

    // Chrome bugfix: resume speech synthesis periodically so it doesn't pause mid-speech
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
      if (i >= chunks.length || !this.isSpeaking) {
        this.isSpeaking = false;
        this._activeUtterance = null;
        clearInterval(this._resumeInterval);
        if (this.onSpeakEnd) this.onSpeakEnd();
        return;
      }

      const chunk = chunks[i++];
      const utter = new SpeechSynthesisUtterance(chunk);
      this._activeUtterance = utter; // Prevent Chrome V8 garbage collection!

      // Re-check voice in case voices loaded late
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
        if (err.error === "canceled" || err.error === "interrupted") {
          return;
        }
        console.warn("[VITH TTS Error]", err);
        speakNext();
      };

      try {
        window.speechSynthesis.resume();
      } catch (e) { }

      window.speechSynthesis.speak(utter);

      try {
        window.speechSynthesis.resume();
      } catch (e) { }
    };

    // If already speaking, cancel and delay slightly so Chrome audio queue flushes cleanly
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      setTimeout(speakNext, 80);
    } else {
      setTimeout(speakNext, 25);
    }
  },

  // Long text chunker (Web Speech API chokes on long strings)
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
    clearInterval(this._resumeInterval);
    this._activeUtterance = null;
    const wasSpeaking = this.isSpeaking;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }

    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    this.isSpeaking = false;
    if (wasSpeaking && this.onSpeakEnd) {
      this.onSpeakEnd();
    }
  },

  // ─── STT: LISTEN ─────────────────────────────────────────────────────────

  // Callbacks for permission state (wired up in app.js)
  onPermissionDenied: null,   // Called when mic access is blocked
  onPermissionGranted: null,  // Called when mic access is confirmed

  startListening() {
    console.log(`%c[VITH STT: startListening]%c Called. isListening: ${this.isListening}, isSpeaking: ${this.isSpeaking}`, "color: #00d4ff; font-weight: bold", "color: inherit");
    if (!this.recognition) {
      console.error("[VITH STT: startListening] Aborted: this.recognition is null or not initialized!");
      return;
    }
    if (this.isListening) {
      console.warn("[VITH STT: startListening] Ignored: Already in listening state.");
      return;
    }
    if (this.isSpeaking) {
      console.log("[VITH STT: startListening] Stopping active TTS speech before listening...");
      this.stopSpeaking();
    }
    clearTimeout(this.silenceTimer);
    try {
      console.log("[VITH STT: startListening] Invoking this.recognition.start()...");
      this.recognition.start();
      if (this.onPermissionGranted) this.onPermissionGranted();
    } catch (e) {
      if (e.name === "InvalidStateError") {
        console.warn("[VITH STT: startListening] InvalidStateError (already started). Syncing state.");
        this.isListening = true;
        if (this.onListenStart) this.onListenStart();
        return;
      }
      console.error("[VITH STT: startListening] Exception thrown during recognition.start():", e);
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        if (this.onPermissionDenied) this.onPermissionDenied("not-allowed");
      } else {
        if (this.onError) this.onError(e);
      }
    }
  },

  stopListening() {
    console.log("%c[VITH STT: stopListening]%c Stopping speech recognition...", "color: #ffaa00; font-weight: bold", "color: inherit");
    clearTimeout(this.silenceTimer);
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {
      console.warn("[VITH STT: stopListening] Error during stop():", e);
    }
    this.isListening = false;
  },

  // ─── VISUALIZER DRIVER ────────────────────────────────────────────────────
  _driveVisualizer(analyser) {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!this.isSpeaking) return;
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      if (this.visualizerCallback) this.visualizerCallback(avg / 255);
      requestAnimationFrame(tick);
    };
    tick();
  }
};
