/**
 * VITH Voice Engine - High-Performance Streaming & Neural TTS Edition
 * Features:
 * - Pipelined Sentence-Level Streaming (First-Sentence Fast Start: perceived latency ~2-3s)
 * - Zero-latency preloaded audio playback for intro and frequent interactions
 * - Fish Audio S2.1 Pro Free ("Sarah" voice) + Web Speech API fallback
 * - Tuned STT silence detection (1000ms) for snappy conversational flow
 * - Synchronized visualizer integration
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
      proxyEndpoint: "/api/tts",
      cloudProxyEndpoint: "https://vinay-react-native-ai.netlify.app/api/tts"
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
  currentAudio: null,
  currentAudioUrl: null,
  activeRequestId: 0,
  recognition: null,
  isListening: false,
  silenceTimer: null,          // Auto-submit after silence
  silenceDelay: 750,           // Tuned from 1000ms to 750ms for snappy voice queries
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
  _preloadedAudios: new Map(), // In-memory client cache of preloaded Audio Blobs
  _pendingFetches: new Map(),  // Active in-flight fetch promises to prevent duplicate network calls

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

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.config.stt.lang || "en-US";
    // On mobile devices, continuous mode causes duplicate cumulative phrases in Android Chrome.
    // Setting continuous=false on mobile is the industry-standard recommendation.
    this.recognition.continuous = isMobile ? false : this.config.stt.continuous;
    this.recognition.interimResults = this.config.stt.interimResults;

    this.recognition.onaudiostart = () => {
      console.log("%c[VITH STT Event: onaudiostart]%c Mic capturing audio stream", "color: #00d4ff", "color: inherit");
    };

    this.recognition.onspeechstart = () => {
      console.log("%c[VITH STT Event: onspeechstart]%c Speech detected by recognizer", "color: #00ff88", "color: inherit");
    };

    this._lastTranscript = "";

    this.recognition.onresult = (event) => {
      let rawTranscript = "";
      let hasInterim = false;

      if (isMobile) {
        // Mobile Android Speech Recognizer sends cumulative phrases in the latest result slot.
        // Reading the latest result avoids concatenating old slots into repeated text!
        for (let i = event.results.length - 1; i >= 0; i--) {
          const item = event.results[i];
          if (item && item[0] && item[0].transcript) {
            rawTranscript = item[0].transcript;
            if (!item.isFinal) hasInterim = true;
            break;
          }
        }
      } else {
        // Desktop: standard accumulation using event.resultIndex
        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item && item[0]) {
            rawTranscript += item[0].transcript + " ";
            if (!item.isFinal) hasInterim = true;
          }
        }
      }

      // Universal speech cleaner: removes engine stutter and adjacent repeated phrases
      const fullTranscript = this._cleanSpeechTranscript(rawTranscript);
      this._lastTranscript = fullTranscript;

      if (this.onListenResult) {
        this.onListenResult(fullTranscript, !hasInterim);
      }

      clearTimeout(this.silenceTimer);
      if (fullTranscript.length > 0) {
        this.silenceTimer = setTimeout(() => {
          this.silenceTimer = null;
          this._lastTranscript = "";
          if (this.onListenSubmit) {
            this.onListenSubmit(fullTranscript);
          }
        }, this.silenceDelay);
      }
    };

    this.recognition.onend = () => {
      console.log("%c[VITH STT Event: onend]%c Recognition cycle ended", "color: #ffaa00", "color: inherit");
      this.isListening = false;

      // On mobile / single-turn: if recognition ends with a captured query, submit immediately!
      if (this.silenceTimer && this._lastTranscript) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
        const toSubmit = this._lastTranscript;
        this._lastTranscript = "";
        if (this.onListenSubmit) {
          this.onListenSubmit(toSubmit);
        }
      }

      if (this.onListenEnd) this.onListenEnd();
    };

    this.recognition.onerror = (e) => {
      console.warn(`[VITH STT Error] "${e.error}"`);
      this.isListening = false;
      this._lastTranscript = "";
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
      if (e.error === "no-speech") return;
      if (e.error === "not-allowed" || e.error === "audio-capture") {
        if (this.onPermissionDenied) this.onPermissionDenied(e.error);
      } else {
        if (this.onError) this.onError(e);
      }
    };
  },

  // ─── STT CLEANER: DEDUPLICATION FILTER ────────────────────────────────────
  _cleanSpeechTranscript(text) {
    if (!text) return "";
    let clean = text.trim();

    // 1. Deduplicate repeated multi-word phrases (2 to 6 words, e.g. "what is his what is his" -> "what is his")
    clean = clean.replace(/\b(\w+(?:\s+\w+){1,6})\s+\1\b/gi, (match, group) => group);

    // 2. Deduplicate immediate stuttered words (e.g. "his his" -> "his")
    clean = clean.replace(/\b(\w+)\s+\1\b/gi, (match, group) => group);

    return clean.replace(/\s+/g, " ").trim();
  },

  // ─── TTS: PREPROCESS & CHUNKING ──────────────────────────────────────────
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

  /**
   * Smart sentence chunking with acronym protection.
   * Splits into natural speech sentences so the first chunk synthesizes in ~1.5s,
   * while subsequent sentences stream in the background!
   */
  /**
   * Smart sentence chunking with acronym protection and spoken breath unit splitting.
   * - Keeps Chunk 0 fast (~35-65 chars) so Fish Audio returns speech in ~1.2s
   * - Sub-splits sentences > 80 chars into natural clauses under 120 chars
   * - Streams subsequent chunks seamlessly while earlier chunks play out loud!
   */
  _splitIntoSpeechChunks(text, maxChunkLen = 120) {
    if (!text) return [];

    // Protect periods in acronyms (A.I., A.P.I., etc.)
    const safe = text
      .replace(/([A-Za-z])\.([A-Za-z])\.([A-Za-z])\./g, (m, a, b, c) => `${a}§${b}§${c}§`)
      .replace(/([A-Za-z])\.([A-Za-z])\./g, (m, a, b) => `${a}§${b}§`);

    // Split on sentence terminators (. ! ?)
    const rawSentences = safe.split(/(?<=[.!?])\s+/);
    const sentences = rawSentences
      .map(s => s.replace(/§/g, ".").trim())
      .filter(s => s.length > 0);

    // Sub-split any sentence > 80 chars into natural spoken breath units (commas, conjunctions, dashes)
    const atomicClauses = [];
    for (const s of sentences) {
      if (s.length <= 80) {
        atomicClauses.push(s);
      } else {
        // Split on em-dash, semicolon, colon, or comma
        const parts = s.split(/(?<=[;—:])\s*|,\s*/);
        for (let p of parts) {
          p = p.trim();
          if (!p) continue;
          if (p.length <= 80) {
            atomicClauses.push(p);
          } else {
            // If still long, split before preposition phrases
            const sub = p.split(/\s+(?=(?:with|across|building|specializing|integrating|featuring|including|delivering|handling)\b)/i);
            for (let sp of sub) {
              sp = sp.trim();
              if (sp) atomicClauses.push(sp);
            }
          }
        }
      }
    }

    const chunks = [];
    let current = "";

    for (let i = 0; i < atomicClauses.length; i++) {
      const clause = atomicClauses[i];

      // Fast-start Chunk 0: target 35-65 chars for instant ~1.2s start
      if (i === 0) {
        current = clause;
        if (current.length < 28 && i + 1 < atomicClauses.length) {
          i++;
          current += " " + atomicClauses[i];
        }
        chunks.push(current);
        current = "";
        continue;
      }

      if (!current) {
        current = clause;
      } else if ((current + " " + clause).length <= maxChunkLen) {
        const sep = /[.!?;—]$/.test(current) ? " " : ", ";
        current += sep + clause;
      } else {
        chunks.push(current);
        current = clause;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  },

  // ─── AUDIO PRELOAD / PRE-WARMING ─────────────────────────────────────────
  /**
   * Pre-fetch audio in background and cache in memory.
   * Enables 0ms instantaneous speech playback!
   */
  async preload(text) {
    if (!text) return null;
    const processed = this._preprocessSpeech(text);
    if (!processed) return null;

    // For multi-sentence scripts (like intro), preload Chunk 0 so speech starts with 0ms delay!
    const chunks = this._splitIntoSpeechChunks(processed);
    const targetText = (chunks && chunks.length > 1) ? chunks[0] : processed;

    if (this._preloadedAudios.has(targetText)) {
      return this._preloadedAudios.get(targetText);
    }

    try {
      console.log(`[VITH Voice: PRELOAD] Pre-fetching audio: "${targetText.slice(0, 45)}..."`);
      const blob = await this._fetchAudioBlob(targetText);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const item = { blob, url };
        this._preloadedAudios.set(targetText, item);
        console.log(`[VITH Voice: PRELOAD READY] "${targetText.slice(0, 45)}..." (${blob.size} bytes)`);
        return item;
      }
    } catch (e) {
      console.warn("[VITH Voice: PRELOAD FAILED]", e.message);
    }
    return null;
  },

  // ─── TTS: FETCH AUDIO BLOB (WITH IN-FLIGHT DEDUPLICATION) ─────────────────
  async _fetchAudioBlob(text, abortSignal) {
    if (!text) return null;

    // Check if there is already an in-flight network request for this exact text (prevents duplicate fetches)
    if (this._pendingFetches.has(text)) {
      console.log(`[VITH Voice] In-flight request reused for: "${text.slice(0, 35)}..."`);
      return await this._pendingFetches.get(text);
    }

    const fetchPromise = (async () => {
      const { apiKey, voiceId, model, format, endpoint, proxyEndpoint, cloudProxyEndpoint } = this.config.fishAudio;
      const payload = {
        text,
        reference_id: voiceId,
        model: model || "s2.1-pro-free",
        format: format || "mp3"
      };

      let response = null;

      // 1. Same-origin proxy server (Netlify production or local Node server)
      try {
        const proxyRes = await fetch(proxyEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortSignal
        });
        if (proxyRes.ok) {
          response = proxyRes;
        }
      } catch (proxyErr) {
        if (abortSignal && abortSignal.aborted) throw proxyErr;
      }

      // 2. Netlify Cloud Proxy fallback (supports CORS for localhost:5500 Live Server testing!)
      if (!response && cloudProxyEndpoint && window.location.hostname !== "vinay-react-native-ai.netlify.app") {
        try {
          const cloudRes = await fetch(cloudProxyEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: abortSignal
          });
          if (cloudRes.ok) {
            response = cloudRes;
          }
        } catch (cloudErr) {
          if (abortSignal && abortSignal.aborted) throw cloudErr;
        }
      }

      // 3. Direct API request fallback
      if (!response) {
        try {
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "model": model || "s2.1-pro-free"
            },
            body: JSON.stringify(payload),
            signal: abortSignal
          });
        } catch (directErr) {
          if (abortSignal && abortSignal.aborted) throw directErr;
        }
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Fish Audio API returned ${response.status}: ${errText}`);
      }

      return await response.blob();
    })();

    this._pendingFetches.set(text, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this._pendingFetches.delete(text);
    }
  },

  // ─── TTS: SPEAK (MAIN ENTRY) ──────────────────────────────────────────────
  async speak(text, options = {}) {
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

    // 1. Instant Playback from Preloaded Cache
    if (this._preloadedAudios.has(processed)) {
      console.log(`[VITH Voice: INSTANT PLAY] Preloaded cache HIT for #${requestId}`);
      const item = this._preloadedAudios.get(processed);
      await this._playAudioUrl(item.url, requestId, options);
      return;
    }

    // 2. Fish Audio Neural TTS
    if (this.config.fishAudio.apiKey && !this.config.tts.useFallback) {
      const chunks = this._splitIntoSpeechChunks(processed);

      // If single chunk or explicit forceSingle option
      if (chunks.length <= 1 || options.forceSingle) {
        await this._speakSingleFishAudio(processed, requestId, options);
      } else {
        // Multi-sentence: Pipelined Streaming (First-Sentence Fast Start)
        await this._speakStreamFishAudio(chunks, requestId, options);
      }
    } else {
      this._speakWebSpeech(processed, requestId);
    }
  },

  // ─── SINGLE CHUNK SPEAK ───────────────────────────────────────────────────
  async _speakSingleFishAudio(text, requestId, options = {}) {
    this._setStatus("synthesizing", "Generating Fish Audio voice (Sarah)...");

    try {
      const blob = await this._fetchAudioBlob(text);
      if (requestId !== this.activeRequestId) return;

      const url = URL.createObjectURL(blob);
      await this._playAudioUrl(url, requestId, options);
    } catch (err) {
      console.warn("[VITH Fish Audio] Switching to Web Speech fallback:", err.message);
      if (requestId !== this.activeRequestId) return;
      this._cleanupAudio();
      this._speakWebSpeech(text, requestId, options);
    }
  },

  // ─── PIPELINED STREAMING SPEAK (FIRST-SENTENCE FAST START) ─────────────────
  async _speakStreamFishAudio(chunks, requestId, options = {}) {
    this._setStatus("synthesizing", `Synthesizing voice response (Chunk 1/${chunks.length})...`);
    console.log(`%c[VITH Pipeline Streaming]%c ${chunks.length} chunks queued for Request #${requestId}`, "color: #00ff88; font-weight: bold", "color: inherit");

    try {
      // 1. Check if Chunk 0 is already in preloaded cache (0ms instant start!)
      let blob0 = null;
      if (this._preloadedAudios.has(chunks[0])) {
        console.log(`[VITH Pipeline Streaming] Preloaded cache HIT for Chunk 0: "${chunks[0].slice(0, 35)}..."`);
        blob0 = this._preloadedAudios.get(chunks[0]).blob;
      } else {
        blob0 = await this._fetchAudioBlob(chunks[0]);
      }

      if (requestId !== this.activeRequestId) return;

      // 2. Play Chunk 0 immediately
      let currentIndex = 0;
      let nextBlobPromise = chunks.length > 1 ? this._fetchAudioBlob(chunks[1]) : null;

      const playCurrentChunk = async (blob, index) => {
        if (requestId !== this.activeRequestId) return;

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        this.currentAudio = audio;
        this.currentAudioUrl = url;

        this._attachVisualizer(audio);

        audio.onplay = () => {
          if (requestId !== this.activeRequestId) {
            audio.pause();
            return;
          }
          this._setStatus("speaking", `Speaking (Fish Audio Sarah - Part ${index + 1}/${chunks.length})`);
          if (index === 0 && options.onPlay) {
            options.onPlay(audio);
          }
        };

        audio.onended = async () => {
          this._cleanupAudio();
          if (requestId !== this.activeRequestId) return;

          const nextIndex = index + 1;
          if (nextIndex < chunks.length) {
            // Pipeline to next chunk
            this._setStatus("synthesizing", `Streaming next sentence (${nextIndex + 1}/${chunks.length})...`);
            try {
              const nextBlob = await nextBlobPromise;
              if (requestId !== this.activeRequestId) return;

              // Pre-fetch the subsequent chunk while nextBlob plays!
              if (nextIndex + 1 < chunks.length) {
                nextBlobPromise = this._fetchAudioBlob(chunks[nextIndex + 1]);
              } else {
                nextBlobPromise = null;
              }

              playCurrentChunk(nextBlob, nextIndex);
            } catch (streamErr) {
              console.warn("[VITH Pipeline Stream Next Error]", streamErr);
              this._finishSpeaking();
            }
          } else {
            // All chunks completed!
            this._finishSpeaking();
          }
        };

        audio.onerror = (e) => {
          console.warn(`[VITH Pipeline] Playback error on chunk ${index}:`, e);
          if (requestId === this.activeRequestId) {
            this._finishSpeaking();
          }
        };

        await audio.play();
      };

      await playCurrentChunk(blob0, 0);

    } catch (err) {
      console.warn("[VITH Pipeline Streaming Error] Falling back to Web Speech:", err.message);
      if (requestId !== this.activeRequestId) return;
      this._cleanupAudio();
      this._speakWebSpeech(chunks.join(" "), requestId, options);
    }
  },

  // ─── PLAY AUDIO URL HELPER ───────────────────────────────────────────────
  async _playAudioUrl(url, requestId, options = {}) {
    if (requestId !== this.activeRequestId) return;

    this.currentAudioUrl = url;
    const audio = new Audio(url);
    this.currentAudio = audio;

    this._attachVisualizer(audio);

    audio.onplay = () => {
      if (requestId !== this.activeRequestId) {
        audio.pause();
        return;
      }
      this._setStatus("speaking", "Speaking (Fish Audio Sarah)");
      if (options.onPlay) options.onPlay(audio);
    };

    audio.onended = () => {
      if (requestId === this.activeRequestId) {
        this._finishSpeaking();
      }
    };

    audio.onerror = (e) => {
      console.warn("[VITH Audio Playback Error]:", e);
      if (requestId === this.activeRequestId) {
        this._finishSpeaking();
      }
    };

    await audio.play();
  },

  _finishSpeaking() {
    this._cleanupAudio();
    this.isSpeaking = false;
    this._setStatus("ready", "Voice ready");
    if (this.onSpeakEnd) this.onSpeakEnd();
  },

  // ─── WEB SPEECH API FALLBACK ─────────────────────────────────────────────
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

  _speakWebSpeech(text, requestId, options = {}) {
    if (!window.speechSynthesis) {
      this.isSpeaking = false;
      this._setStatus("ready", "Voice ready");
      if (this.onSpeakEnd) this.onSpeakEnd();
      return;
    }

    this._setStatus("fallback", "Speaking via browser voice engine");

    // Strip Fish Audio bracket emotion tags (e.g. [warmly], [pause]) before Web Speech speaks
    const cleanText = text
      .replace(/\[.*?\]\s*/g, "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleanText) return;

    if (options && options.onPlay) {
      try { options.onPlay(null); } catch (e) {}
    }

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

  // ─── STOP SPEAKING & CLEANUP ─────────────────────────────────────────────
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
      // Don't revoke URLs that are cached in _preloadedAudios!
      let isPreloaded = false;
      for (const val of this._preloadedAudios.values()) {
        if (val.url === this.currentAudioUrl) {
          isPreloaded = true;
          break;
        }
      }
      if (!isPreloaded) {
        try { URL.revokeObjectURL(this.currentAudioUrl); } catch (e) {}
      }
    }
    this.currentAudioUrl = null;
    this.currentAudio = null;
  },

  // ─── VISUALIZER BINDING ──────────────────────────────────────────────────
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

  // ─── SPEECH TO TEXT CONTROLS ─────────────────────────────────────────────
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
