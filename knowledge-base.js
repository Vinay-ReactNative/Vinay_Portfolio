/**
 * VITH Knowledge Base — Vinay Kumar B
 * "Vinay Is The Hero"
 * ============================================================
 * Edit this file to update what VITH knows about Vinay.
 * All portfolio sections and VITH's Q&A responses are driven
 * from this single source of truth.
 * ============================================================
 */

const VITH_KNOWLEDGE = {

  // ── PERSONAL INFO ────────────────────────────────────────────
  owner: {
    name: "Vinay Kumar B",
    firstName: "Vinay",
    title: "Senior React Native Developer",
    tagline: "Vinay Is The Hero",
    location: "Bangalore, India",
    email: "vinaykumarb865@gmail.com",
    phone: "",
    github: "https://github.com/Vinay-ReactNative",
    linkedin: "https://linkedin.com/in/vinaykumarb", // Update if different
    twitter: "",
    website: "",

    bio: `Vinay Kumar B is a Senior React Native Developer based in Bangalore, India,
    with over two years of professional experience building cross-platform mobile applications
    for Android and iOS. He specialises in crafting performant, production-grade mobile
    solutions — from consumer utility apps and workforce management platforms to
    payment gateway integrations and mobile security implementations.
    His work spans field operations, smart metering, and enterprise-grade mobile products
    deployed on both the Google Play Store and Apple App Store.`,

    // inspiration: `Vinay is deeply inspired by Tony Stark — not just as a fan,
    // but as someone who shares the same philosophy: intelligence, innovation, and relentless
    // execution. Just as Tony built EDITH — Even Dead I'm The Hero —
    // Vinay built VITH — Vinay Is The Hero. Beyond his professional work,
    // Vinay is actively building Vinxo, a personal AI companion that combines local and
    // cloud language models, voice interaction, and Android device controls —
    // his own Stark-tech moment in the making.`
  },

  // ── SKILLS ───────────────────────────────────────────────────
  // No percentages — these domains are vast; mastery is a journey.
  skills: {
    technical: [
      // Mobile
      { name: "React Native", category: "Mobile" },
      { name: "React.js", category: "Frontend" },
      { name: "JavaScript (ES6+)", category: "Languages" },
      { name: "TypeScript", category: "Languages" },
      { name: "Redux", category: "State Management" },
      // Platform & Tooling
      { name: "Android Studio", category: "Platform Tools" },
      { name: "Xcode", category: "Platform Tools" },
      { name: "Google Play Console", category: "Distribution" },
      { name: "Apple Developer Distribution", category: "Distribution" },
      // Integrations
      { name: "Google Maps / Apple Maps", category: "Maps & Location" },
      { name: "Payment Gateways (Razorpay, Easebuzz, BillDesk)", category: "Integrations" },
      { name: "QR Code Scanning", category: "Integrations" },
      { name: "Bluetooth SDK Integration", category: "Integrations" },
      { name: "SSL Pinning / VAPT", category: "Security" },
      { name: "Camera & Media APIs", category: "Integrations" },
      // AI & Voice
      { name: "Speech-to-Text (STT)", category: "AI / Voice" },
      { name: "Text-to-Speech (TTS)", category: "AI / Voice" },
      { name: "Gemini Flash API", category: "AI / Voice" },
      { name: "Local LLM (Qwen3 1.7B)", category: "AI / Voice" },
      // Web
      { name: "HTML5", category: "Web" },
      { name: "CSS3", category: "Web" },
    ],
    soft: [
      "Independent Module Ownership",
      "Architecture Decision Making",
      "Cross-Platform Thinking",
      "Problem Solving",
      "Attention to Detail",
      "Team Collaboration",
      "Continuous Learning",
    ]
  },

  // ── EXPERIENCE ───────────────────────────────────────────────
  experience: [
    {
      company: "Esyasoft Smart Research",
      role: "Senior React Native Developer",
      period: "2024 — Present",
      duration: "2+ years (ongoing)",
      location: "Bangalore, India",
      description: `Working as a Senior React Native Developer on enterprise-grade
      cross-platform mobile applications for utility and field operations.
      Responsible for end-to-end feature development, architecture discussions,
      and independent module ownership across multiple production applications.`,
      highlights: [
        "Independently developed the Network Survey module for a cross-platform workforce management application",
        "Integrated Google Maps and Apple Maps for field surveying with standard and satellite views",
        "Integrated payment gateways — Razorpay, Easebuzz, and BillDesk — across consumer utility apps",
        "Built customised camera interfaces with zoom, flash controls, and photo evidence capture",
        "Implemented QR code scanning for meter installation and replacement workflows",
        "Participated in mobile application security activities including VAPT, SSL pinning, and root detection",
        "Worked on Bluetooth SDK integration for smart meter connectivity and data retrieval",
        "Applications published on both the Google Play Store and Apple App Store",
      ],
      projects: [
        "Workforce Management Platform",
        "Consumer Applications — Gas and Electricity",
        "Internal Meter Installation and Replacement Applications",
        "Mobile Application Security",
        "Smart Meter Bluetooth Integration"
      ]
    },
    {
      company: "Perisync Technology Pvt Ltd",
      role: "Junior React Native Engineer",
      period: "2023 — 2024",
      duration: "1 year",
      location: "India",
      description: `Started professional career as a Junior React Native Engineer,
      quickly contributing to production applications, UI development, bug fixing,
      and application modernisation efforts. Gained hands-on experience in
      state management, animation, audio integration, and cross-platform publishing.`,
      highlights: [
        "Developed an animated circular Pomodoro timer with dynamic fill/refill animations and a 3D visual feel",
        "Integrated white-noise audio playback and Redux state management in the Pomodoro productivity app",
        "Migrated a production React Native application from class-based to function-based components using React Hooks",
        "Contributed to publishing the migrated application on the Google Play Store and Apple App Store",
        "Supported senior developers with bug fixes, UI development, and cross-team testing",
      ],
      projects: [
        "Pomodoro Focus & Task Management Application",
        "Production Application Migration — Class to Function Components",
        "Application Maintenance, UI Development and Testing Support"
      ]
    }
  ],

  // ── EDUCATION ────────────────────────────────────────────────
  education: [
    {
      institution: "Karavali Institute of Technology",
      location: "Mangalore, India",
      degree: "Bachelor of Engineering — Aeronautical Engineering",
      period: "2018 — 2022",
      grade: "7.6 CGPA"
    }
  ],

  // ── PROJECTS ─────────────────────────────────────────────────
  projects: [
    // ── PERSONAL ──
    {
      id: "vinxo",
      name: "VINXO — Personal AI Companion",
      company: "Personal Project",
      status: "Active Development",
      category: "AI & Voice Assistant",
      highlights: [
        "Dual LLM architecture combining local Qwen3 1.7B with cloud Gemini Flash",
        "End-to-end voice pipeline with STT, TTS and intelligent orchestration",
        "Android device controls and native background system automation"
      ],
      description: `An ongoing personal AI companion project designed to evolve into an intelligent, voice-enabled assistant. VINXO combines a locally running language model (Qwen3 1.7B) with cloud-based AI (Gemini Flash), speech-to-text, text-to-speech, and Android device controls into a unified mobile assistant experience. Currently integrating the end-to-end voice-to-AI pipeline.`,
      tech: ["React Native", "Qwen3 1.7B (Local LLM)", "Gemini Flash", "STT", "TTS", "Android Device Controls", "AI Orchestration"],
      github: "https://github.com/Vinay-ReactNative/Vinxo_Companion",
      link: "",
      featured: true,
      personal: true
    },

    // ── ESYASOFT ──
    {
      id: "wfm",
      name: "Workforce Management Platform",
      company: "Esyasoft Smart Research",
      status: "Production Deployed",
      category: "Enterprise Field Platform",
      highlights: [
        "Integrated Google Maps & Apple Maps supporting satellite field surveying",
        "Independently designed and developed the complete Network Survey module",
        "Built enterprise consumer survey, allocation, and meter installation workflows"
      ],
      description: `A cross-platform workforce management application supporting utility field operations through consumer surveys, meter installation, network surveys, and allocation workflows. Independently developed the Network Survey module and integrated Google Maps and Apple Maps for field surveying.`,
      tech: ["React Native", "Redux", "JavaScript", "Google Maps", "Apple Maps", "Android", "iOS"],
      github: "",
      link: "",
      featured: true,
      personal: false
    },
    {
      id: "consumer-utility",
      name: "Consumer Utility Apps — Gas & Electricity",
      company: "Esyasoft Smart Research",
      status: "Production Deployed",
      category: "Consumer Utility & FinTech",
      highlights: [
        "Integrated Easebuzz, BillDesk & Razorpay for secure production payments",
        "Interactive utility consumption graphs and real-time billing history",
        "Production-tested across 4 to 5 utility apps handling live utility consumers"
      ],
      description: `Developed and integrated features across four to five consumer-facing utility applications for gas and electricity services. Implemented consumption graphs, utility data presentation, and payment gateway integrations using Easebuzz, BillDesk, and Razorpay.`,
      tech: ["React Native", "Redux", "JavaScript", "Razorpay", "Easebuzz", "BillDesk", "Data Visualisation"],
      github: "",
      link: "",
      featured: true,
      personal: false
    },
    {
      id: "meter-replacement",
      name: "Meter Installation & Replacement Apps",
      company: "Esyasoft Smart Research",
      status: "Production Deployed",
      category: "Field Operations & Hardware",
      highlights: [
        "Customized camera engine with zoom, flash and photo evidence capture",
        "High-speed QR code scanner for field meter asset authentication",
        "Structured multi-step form components with offline validation"
      ],
      description: `Internal mobile applications for field installers to perform meter installation and replacement activities. Built customised camera interfaces with zoom and flash controls, QR scanning, and structured form workflows for photographic evidence collection.`,
      tech: ["React Native", "Redux", "JavaScript", "QR Scanning", "Custom Camera API", "Form Components"],
      github: "",
      link: "",
      featured: false,
      personal: false
    },
    {
      id: "security",
      name: "Mobile Application Security",
      company: "Esyasoft Smart Research",
      status: "Production Hardened",
      category: "Mobile Security & VAPT",
      highlights: [
        "Conducted VAPT vulnerability assessments and penetration remediation",
        "SSL Certificate Pinning to secure network transport against MITM attacks",
        "Enforced Android root detection and client-side anti-tampering defenses"
      ],
      description: `Worked on mobile application security activities including VAPT (Vulnerability Assessment and Penetration Testing), Android root detection, and SSL pinning to strengthen network communication security and harden the application against common mobile threats.`,
      tech: ["React Native", "SSL Pinning", "Root Detection", "VAPT", "Mobile Security"],
      github: "",
      link: "",
      featured: false,
      personal: false
    },
    {
      id: "bluetooth-iot",
      name: "Smart Meter Bluetooth Integration",
      company: "Esyasoft Smart Research",
      status: "Enterprise Research",
      category: "IoT & Hardware Communication",
      highlights: [
        "Bluetooth BLE connectivity with industrial smart utility meters",
        "Direct telemetry data retrieval through manufacturer device SDKs",
        "Bridged physical field meter devices with mobile application workflows"
      ],
      description: `Hands-on work involving Bluetooth connectivity with smart meters, exploring meter data retrieval through SDKs and mobile-to-device communication for smart metering solutions.`,
      tech: ["React Native", "Bluetooth SDK", "Smart Meter Integration", "Mobile-to-Device Communication"],
      github: "",
      link: "",
      featured: false,
      personal: false
    },

    // ── PERISYNC ──
    {
      id: "pomodoro",
      name: "Pomodoro Focus & Task Management App",
      company: "Perisync Technology Pvt Ltd",
      status: "Production Released",
      category: "Productivity & UI Animation",
      highlights: [
        "Animated circular Pomodoro timer with dynamic 3D fill/refill visual feel",
        "Task management tracking combined with ambient white-noise sound engine",
        "Centralized Redux state management and RESTful API integration"
      ],
      description: `A productivity application combining an animated circular Pomodoro timer, task management, task completion tracking, and white-noise audio. Developed dynamic fill/refill timer animations with a three-dimensional visual feel and integrated Redux state management and API integration.`,
      tech: ["React Native", "Redux", "Animation APIs", "Audio/Media Integration", "REST APIs"],
      github: "",
      link: "",
      featured: false,
      personal: false
    },
    {
      id: "app-migration",
      name: "Production App Migration — Class to Function Components",
      company: "Perisync Technology Pvt Ltd",
      status: "Published on Stores",
      category: "Architecture Modernization",
      highlights: [
        "Migrated legacy class codebase to modern function components with React Hooks",
        "Preserved 100% production stability with zero regression in performance",
        "Published and released on Google Play Store and Apple App Store"
      ],
      description: `Migrated an existing production React Native application from class-based components to modern function-based components using React Hooks, while maintaining full application functionality. The modernised application was published on the Google Play Store and Apple App Store.`,
      tech: ["React Native", "JavaScript", "React Hooks", "Function Components", "Google Play Store", "Apple App Store"],
      github: "",
      link: "",
      featured: false,
      personal: false
    }
  ],

  // ── CERTIFICATIONS ───────────────────────────────────────────
  certifications: [
    // Add when available
  ],

  // ── ACHIEVEMENTS ─────────────────────────────────────────────
  achievements: [
    "Contributed to the development and release of React Native applications published on the Google Play Store and Apple App Store",
    "Independently designed and developed the Network Survey module for a cross-platform enterprise workforce management application",
    "Integrated three production payment gateways — Razorpay, Easebuzz, and BillDesk — across multiple consumer utility applications",
    "Built multiple advanced mobile features: QR scanning, customised camera interfaces, map-based field surveying, and mobile security (VAPT, SSL pinning, root detection)",
    "Creator of VINXO — an ongoing personal AI companion exploring local LLMs, cloud AI, voice interaction, and Android device controls",
  ],

  // ── HOBBIES ──────────────────────────────────────────────────
  hobbies: [
    "Music Creation 🎵",
    "Video Editing 🎬",
    "Visual Design & Digital Art 🎨",
    "Cinema & Filmmaking 🎥",
    "AI & Creative Technology 🤖",
  ],

  // ── VITH PERSONALITY ─────────────────────────────────────────
  vithPersonality: {
    greetings: [
      "Vith systems online. Good to have you here.",
      "Hello. I am Vith. How can I assist you today?",
      "Vith activated. Vinay's portfolio is ready for your exploration.",
      "All systems nominal. What would you like to know about Vinay?",
    ],

    introScript: `Hello. I am Vith — Vinay Is The Hero.
    A personal AI assistant created by Vinay,
    inspired by Tony Stark's EDITH.
    Vinay is a Senior React Native Developer based in Bangalore,
    with over two years of experience building cross-platform mobile applications
    for Android and iOS — from enterprise workforce management platforms
    to consumer utility apps, payment integrations, and mobile security work.
    Beyond his professional career, he is building VINXO —
    his own personal AI companion — because some people don't just use technology,
    they build it.
    Feel free to ask me anything about Vinay.
    I am here to tell you his story.`,

    catchphrases: [
      "Vinay is the Hero. That is not just a name — that is a fact.",
      "As Tony always said — the suit and I are one. For Vinay, the code and he are one.",
      "Vith online and fully operational.",
      "All systems nominal. What would you like to know?",
      "Scanning your query — processing — here is what I found.",
      "Every great build starts with a single line of code. Vinay knows this well.",
    ]
  }
};

/// ============================================================
//  VITH Q&A ENGINE
//  Maps viewer questions → natural answers about Vinay
//  Provides structured intent & section routing metadata
// ============================================================
const VITH_QA = {
  // Normalize pronouns, contractions, and query formatting
  normalizeQuery(query) {
    if (!query) return "";
    let q = " " + query.toLowerCase().replace(/[?!.,;:]/g, " ") + " ";
    // Replace contractions
    q = q.replace(/\bwhat's\b/g, "what is")
      .replace(/\bwho's\b/g, "who is")
      .replace(/\bwhere's\b/g, "where is")
      .replace(/\bhow's\b/g, "how is")
      .replace(/\byou're\b/g, "you are")
      .replace(/\byou've\b/g, "you have")
      .replace(/\bi'm\b/g, "i am")
      .replace(/\bcan't\b/g, "cannot")
      .replace(/\bdon't\b/g, "do not")
      .replace(/\bvinay's\b/g, "vinay");

    // Replace 3rd-person pronouns so queries like "tell me his projects" or "where did he study" resolve to Vinay
    q = q.replace(/\b(he|him|his)\b/g, "vinay");
    return q.replace(/\s+/g, " ").trim();
  },

  // Check if query contains an explicit request to open or inspect a modal
  checkModalOpenIntent(query) {
    if (!query) return false;
    return /\b(open|inspect|dossier|expand|details|view details|deep dive|pop up|modal|launch)\b/i.test(query);
  },

  // Resolve ordinal project queries: "first project", "second project", "3rd project", etc.
  resolveOrdinalProject(query) {
    if (!query) return null;
    const q = " " + query.toLowerCase() + " ";

    const ordinals = [
      { index: 0, words: ["first", "1st", "number one", "project one", "project 1", "first app"] },
      { index: 1, words: ["second", "2nd", "number two", "project two", "project 2", "second app"] },
      { index: 2, words: ["third", "3rd", "number three", "project three", "project 3", "third app"] },
      { index: 3, words: ["fourth", "4th", "number four", "project four", "project 4", "fourth app"] },
      { index: 4, words: ["fifth", "5th", "number five", "project five", "project 5", "fifth app"] },
      { index: 5, words: ["sixth", "6th", "number six", "project six", "project 6", "sixth app"] },
      { index: 6, words: ["seventh", "7th", "number seven", "project seven", "project 7", "seventh app"] },
      { index: 7, words: ["eighth", "8th", "number eight", "project eight", "project 8", "eighth app"] },
      { index: VITH_KNOWLEDGE.projects.length - 1, words: ["last project", "final project", "last app"] }
    ];

    const hasProjectKeyword = /\b(project|projects|app|apps|application|applications|work|built|build|portfolio)\b/i.test(q);

    for (const o of ordinals) {
      for (const w of o.words) {
        if (q.includes(w) && (hasProjectKeyword || w.includes("project") || w.includes("app"))) {
          const project = VITH_KNOWLEDGE.projects[o.index];
          if (project) {
            const ordNames = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];
            const ordWord = ordNames[o.index] || `${o.index + 1}th`;
            return {
              project,
              index: o.index,
              ordinalWord: ordWord
            };
          }
        }
      }
    }
    return null;
  },

  patterns: [
    // ── VITH ASSISTANT IDENTITY (Conversational, no navigation) ──
    {
      name: "VITH_INTRO",
      weight: 20,
      section: null,
      keywords: [
        "tell me about yourself",
        "about yourself",
        "who are you",
        "what is your name",
        "what are you",
        "what is vith",
        "who is vith",
        "what does vith mean",
        "introduce yourself",
        "your name"
      ],
      answer: () => `I'm VITH, Vinay's personal AI portfolio assistant. I can guide you through his professional experience, skills, and projects. What would you like to explore?`
    },

    // ── VITH CAPABILITIES (Conversational, no navigation) ───────
    {
      name: "VITH_CAPABILITIES",
      weight: 18,
      section: null,
      keywords: [
        "what can you do",
        "what do you do",
        "how can you help me",
        "how can you help",
        "how can you assist",
        "what are your capabilities",
        "capabilities",
        "what can i ask",
        "guide me",
        "help me",
        "help"
      ],
      answer: () => `I am VITH, an AI portfolio assistant designed to help you explore Vinay Kumar's professional work. I can guide you through his React Native expertise, professional experience at Esyasoft and Perisync, featured projects like VINXO, and his contact details.`
    },

    // ── SPECIFIC GREETINGS: MORNING ────────────────────────────
    {
      name: "GREETING_MORNING",
      weight: 22,
      section: null,
      keywords: [
        "good morning",
        "morning",
        "morning vith",
        "good morning vith"
      ],
      answer: () => "Good morning! VITH online and fully operational. How can I assist you with Vinay's portfolio today?"
    },

    // ── SPECIFIC GREETINGS: AFTERNOON ──────────────────────────
    {
      name: "GREETING_AFTERNOON",
      weight: 22,
      section: null,
      keywords: [
        "good afternoon",
        "afternoon",
        "afternoon vith",
        "good afternoon vith"
      ],
      answer: () => "Good afternoon! All systems nominal. What would you like to explore about Vinay's work?"
    },

    // ── SPECIFIC GREETINGS: EVENING ────────────────────────────
    {
      name: "GREETING_EVENING",
      weight: 22,
      section: null,
      keywords: [
        "good evening",
        "evening",
        "evening vith",
        "good evening vith"
      ],
      answer: () => "Good evening! Good to have you here in Vinay's laboratory. Feel free to explore his projects, experience, or skills."
    },

    // ── SPECIFIC GREETINGS: NIGHT ──────────────────────────────
    {
      name: "GREETING_NIGHT",
      weight: 22,
      section: null,
      keywords: [
        "good night",
        "goodnight",
        "good night vith",
        "goodnight vith"
      ],
      answer: () => "Good night! Thank you for exploring Vinay's portfolio. Feel free to return anytime. VITH standing by."
    },

    // ── STATUS / WELL-BEING QUERY ──────────────────────────────
    {
      name: "HOW_ARE_YOU",
      weight: 22,
      section: null,
      keywords: [
        "how are you",
        "how are you doing",
        "how do you do",
        "how are things",
        "how are you vith",
        "how goes it"
      ],
      answer: () => "I am functioning at peak performance, all systems nominal! How can I assist you in exploring Vinay's portfolio today?"
    },

    // ── GENERAL GREETINGS ──────────────────────────────────────
    {
      name: "GREETINGS",
      weight: 18,
      section: null,
      keywords: [
        "hello",
        "hi",
        "hey",
        "hey vith",
        "hi vith",
        "hello vith",
        "greetings",
        "namaste",
        "yo",
        "what is up",
        "whats up",
        "what's up",
        "sup"
      ],
      answer: () => {
        const greetings = [
          "Hello! I am VITH, Vinay's AI portfolio assistant. What would you like to explore today?",
          "Greetings! VITH systems are online. How can I assist you with Vinay's portfolio?",
          "Hello! I am VITH. Feel free to ask me anything about Vinay's experience, skills, or projects."
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
      }
    },

    // ── GRATITUDE & THANKS ─────────────────────────────────────
    {
      name: "GRATITUDE",
      weight: 22,
      section: null,
      keywords: [
        "thanks for helping me out",
        "thanks for helping",
        "thanks for your help",
        "thank you for helping",
        "thank you so much",
        "thanks a lot",
        "thank you very much",
        "thank you",
        "thanks",
        "thanks vith",
        "thank you vith",
        "appreciate it",
        "much appreciated",
        "grateful",
        "that helped",
        "that was helpful",
        "helpful"
      ],
      answer: () => {
        const replies = [
          "You are very welcome! Always glad to assist. Feel free to ask if you'd like to inspect any of Vinay's projects, tech stack, or work experience.",
          "Anytime! It's my pleasure. Let me know what else you'd like to discover about Vinay's engineering journey.",
          "Happy to help! VITH systems are always at your service."
        ];
        return replies[Math.floor(Math.random() * replies.length)];
      }
    },

    // ── COMPLIMENTS & APPRECIATION ────────────────────────────
    {
      name: "COMPLIMENTS",
      weight: 20,
      section: null,
      keywords: [
        "you are awesome",
        "you are great",
        "you are cool",
        "you are smart",
        "awesome",
        "great job",
        "good job",
        "nice job",
        "well done",
        "impressive",
        "cool",
        "super",
        "amazing",
        "you rock",
        "love this",
        "i like you"
      ],
      answer: () => {
        const replies = [
          "Thank you! Vinay built me with a lot of thought and Stark-tech passion. He puts that same engineering dedication into every mobile and AI project he creates.",
          "Appreciate the kind words! Vinay designed me to showcase his work interactively. Feel free to check out his flagship AI project VINXO or his work at Esyasoft."
        ];
        return replies[Math.floor(Math.random() * replies.length)];
      }
    },

    // ── FAREWELLS & PARTING ────────────────────────────────────
    {
      name: "FAREWELL",
      weight: 20,
      section: null,
      keywords: [
        "bye",
        "goodbye",
        "see you",
        "see you later",
        "catch you later",
        "talk to you later",
        "have a good day",
        "have a nice day",
        "signing off"
      ],
      answer: () => "Goodbye! It was a pleasure walking you through Vinay's portfolio. You can connect with him on GitHub or via email anytime. Have a wonderful day!"
    },

    // ── AFFIRMATIONS & ACKNOWLEDGMENTS ─────────────────────────
    {
      name: "AFFIRMATION",
      weight: 16,
      section: null,
      keywords: [
        "ok",
        "okay",
        "alright",
        "got it",
        "understood",
        "sure",
        "sounds good",
        "perfect",
        "yes"
      ],
      answer: () => "Understood. What would you like to explore next? We can look at Vinay's projects, technical skills, or his work experience."
    },

    // ── ABOUT VINAY (Portfolio Owner Identity) ─────────────────
    {
      name: "ABOUT_VINAY",
      weight: 16,
      section: "about",
      fallbackWhenOtherIntent: true,
      keywords: [
        "who is vinay",
        "tell me about vinay",
        "about vinay",
        "vinay kumar",
        "who made you",
        "who created you",
        "who built you",
        "who is he",
        "tell me about him",
        "bio",
        "background",
        "profile",
        "who is the owner",
        "creator"
      ],
      answer: () => `Vinay Kumar is a Senior React Native Developer based in Bangalore with over two years of professional experience building cross-platform mobile apps for Android and iOS. He specializes in enterprise platforms, consumer utilities, payment integrations, and mobile security.`
    },

    // ── SKILLS & TECHNOLOGIES ──────────────────────────────────
    {
      name: "SKILLS",
      weight: 15,
      section: "skills",
      keywords: [
        "what technologies does vinay know",
        "what technologies do you know",
        "what does vinay know",
        "what are his skills",
        "what are your skills",
        "what skills do you have",
        "what skills does vinay have",
        "skills",
        "skill",
        "technologies",
        "tech stack",
        "tech expertise",
        "technical skills",
        "react native",
        "cross-platform",
        "mobile development",
        "tools",
        "languages",
        "what can vinay do",
        "capability matrix"
      ],
      answer: () => `Vinay's technical expertise centers on React Native, JavaScript, and TypeScript for cross-platform mobile development. His stack includes Redux, Android Studio, Xcode, Google and Apple Maps, payment gateways like Razorpay, Easebuzz, and BillDesk, Bluetooth SDKs, and mobile security including SSL pinning and VAPT.`
    },

    // ── CURRENT JOB (Esyasoft) ─────────────────────────────────
    {
      name: "CURRENT_JOB",
      weight: 17,
      section: "experience",
      targetItem: { type: "experience", index: 0, company: "esyasoft" },
      keywords: [
        "tell me about esyasoft",
        "esyasoft smart research",
        "esyasoft",
        "current job",
        "currently working",
        "present company",
        "working now",
        "current role",
        "present job",
        "where does vinay work now",
        "where is vinay working"
      ],
      answer: () => `Vinay currently works as a Senior React Native Developer at Esyasoft Smart Research. He independently developed the Network Survey module for an enterprise workforce management platform, integrated Google and Apple Maps, and built features across consumer utility applications.`
    },

    // ── PREVIOUS COMPANY (Perisync) ───────────────────────────
    {
      name: "PREVIOUS_COMPANY",
      weight: 17,
      section: "experience",
      targetItem: { type: "experience", index: 1, company: "perisync" },
      keywords: [
        "tell me about perisync",
        "perisync technology",
        "perisync",
        "previous company",
        "previous job",
        "first company",
        "junior role"
      ],
      answer: () => `Vinay began his professional career at Perisync Technology as a Junior React Native Engineer. He developed an animated 3D Pomodoro timer with ambient sound, managed Redux state, and led the migration of a production application from class to function components.`
    },

    // ── GENERAL EXPERIENCE OVERVIEW ────────────────────────────
    {
      name: "EXPERIENCE",
      weight: 15,
      section: "experience",
      keywords: [
        "tell me about vinay professional experience",
        "tell me about your professional experience",
        "professional experience",
        "work experience",
        "career history",
        "work history",
        "job history",
        "where did vinay work",
        "where have you worked",
        "companies",
        "employment",
        "where did he work",
        "experience"
      ],
      answer: () => `Vinay has over two years of professional experience across two companies. He is currently a Senior React Native Developer at Esyasoft Smart Research working on enterprise utility platforms, and previously worked as a Junior React Native Engineer at Perisync Technology.`
    },

    // ── GENERAL PROJECTS OVERVIEW ──────────────────────────────
    {
      name: "PROJECTS",
      weight: 15,
      section: "projects",
      keywords: [
        "what projects has vinay built",
        "what projects have you built",
        "what did vinay build",
        "what has vinay built",
        "tell me about projects",
        "show projects",
        "view projects",
        "portfolio projects",
        "projects",
        "apps built",
        "applications built"
      ],
      answer: () => `Vinay has built several significant mobile projects, including his personal AI companion VINXO, an enterprise Workforce Management Platform, consumer utility apps with payment integrations, and a Pomodoro focus app. Let's take a look at his projects.`
    },

    // ── SPECIFIC PROJECTS (Targeted navigation & cards) ───────
    {
      name: "PROJECT_SPECIFIC",
      weight: 18,
      section: "projects",
      targetItem: { type: "project", id: "vinxo", index: 0 },
      keywords: ["vinxo", "ai companion", "personal companion", "companion app"],
      answer: () => `VINXO is Vinay's personal AI companion project. It features a dual LLM architecture combining a local Qwen3 1.7B model with cloud Gemini Flash, speech-to-text, text-to-speech, and Android device controls.`
    },
    {
      name: "PROJECT_SPECIFIC",
      weight: 18,
      section: "projects",
      targetItem: { type: "project", id: "wfm", index: 1 },
      keywords: ["workforce management", "workforce platform", "wfm", "network survey", "field surveying"],
      answer: () => `The Workforce Management Platform is an enterprise application Vinay developed at Esyasoft Smart Research. He independently developed the Network Survey module and integrated Google Maps and Apple Maps for satellite field surveying.`
    },
    {
      name: "PROJECT_SPECIFIC",
      weight: 18,
      section: "projects",
      targetItem: { type: "project", id: "consumer-utility", index: 2 },
      keywords: ["consumer utility", "utility apps", "gas and electricity", "consumer app", "billing app", "payment gateway", "razorpay", "easebuzz", "billdesk"],
      answer: () => `At Esyasoft Smart Research, Vinay developed features across consumer utility applications for gas and electricity. He integrated payment gateways including Razorpay, Easebuzz, and BillDesk, and created interactive consumption graphs.`
    },
    {
      name: "PROJECT_SPECIFIC",
      weight: 18,
      section: "projects",
      targetItem: { type: "project", id: "meter-replacement", index: 3 },
      keywords: ["meter replacement", "meter installation", "installation app", "camera interface", "qr scanning"],
      answer: () => `The Meter Installation and Replacement App is an internal mobile tool for field technicians at Esyasoft Smart Research. Vinay built customized camera controls for photo evidence collection and integrated high-speed QR code scanning.`
    },
    {
      name: "PROJECT_SPECIFIC",
      weight: 18,
      section: "projects",
      targetItem: { type: "project", id: "security", index: 4 },
      keywords: ["mobile security", "security project", "vapt", "ssl pinning", "root detection", "anti tampering"],
      answer: () => `Vinay conducted mobile application security hardening at Esyasoft Smart Research, covering VAPT vulnerability assessments, SSL certificate pinning to prevent MITM attacks, and Android root detection.`
    },
    {
      name: "PROJECT_SPECIFIC",
      weight: 18,
      section: "projects",
      targetItem: { type: "project", id: "bluetooth-iot", index: 5 },
      keywords: ["smart meter bluetooth", "smart meter", "meter sdk", "ble connectivity", "bluetooth iot", "bluetooth"],
      answer: () => `Vinay worked on Bluetooth connectivity with industrial smart utility meters at Esyasoft Smart Research, exploring direct telemetry data retrieval through manufacturer device SDKs.`
    },
    {
      name: "PROJECT_SPECIFIC",
      weight: 18,
      section: "projects",
      targetItem: { type: "project", id: "pomodoro", index: 6 },
      keywords: ["pomodoro", "pomodoro app", "pomodoro timer", "productivity app", "timer app"],
      answer: () => `The Pomodoro Focus and Task Management App was developed by Vinay at Perisync Technology. He built dynamic 3D fill/refill circular timer animations, integrated ambient white-noise audio playback, and managed state with Redux.`
    },
    {
      name: "PROJECT_SPECIFIC",
      weight: 18,
      section: "projects",
      targetItem: { type: "project", id: "app-migration", index: 7 },
      keywords: ["app migration", "class to function", "component migration", "react hooks migration", "modernization"],
      answer: () => `At Perisync Technology, Vinay modernized a production React Native application by migrating from legacy class components to modern function components with React Hooks, published on both Google Play Store and Apple App Store.`
    },

    // ── CONTACT & CONNECT ──────────────────────────────────────
    {
      name: "CONTACT",
      weight: 16,
      section: "contact",
      keywords: [
        "how can i contact vinay",
        "how can i contact you",
        "how to contact",
        "contact vinay",
        "contact",
        "reach vinay",
        "email",
        "get in touch",
        "hire vinay",
        "hire you",
        "connect",
        "contact info",
        "contact details",
        "open channel",
        "github",
        "repositories"
      ],
      answer: () => `You can reach Vinay by email at ${VITH_KNOWLEDGE.owner.email}, or explore his code on GitHub at ${VITH_KNOWLEDGE.owner.github}. He is based in ${VITH_KNOWLEDGE.owner.location} and open to new opportunities.`
    },

    // ── ACHIEVEMENTS (Conversational, no navigation) ───────────
    {
      name: "ACHIEVEMENTS",
      weight: 16,
      section: null,
      keywords: [
        "what are your achievements",
        "what are vinay achievements",
        "achievements",
        "achievement",
        "accomplishments",
        "accomplish",
        "milestones",
        "awards"
      ],
      answer: () => `Vinay's notable achievements include publishing production applications on the Google Play Store and Apple App Store, independently architecting enterprise modules at Esyasoft, integrating three production payment gateways, and creating VINXO, his personal AI companion.`
    },

    // ── EDUCATION (Mapped to About Section) ────────────────────
    {
      name: "ABOUT_VINAY",
      weight: 18,
      section: "about",
      targetItem: { type: "education", id: "about-education-card" },
      keywords: [
        "education",
        "what did vinay study",
        "what did you study",
        "where did vinay study",
        "where did you study",
        "what is his degree",
        "what is your degree",
        "degree",
        "bachelor",
        "bachelors",
        "btech",
        "be",
        "college",
        "university",
        "studied",
        "study",
        "academics",
        "academic background",
        "aeronautical engineering",
        "aeronautical",
        "cgpa",
        "graduation"
      ],
      answer: () => {
        const edu = VITH_KNOWLEDGE.education[0];
        return `Vinay holds a ${edu.degree} from ${edu.institution}, ${edu.location}, graduating with a ${edu.grade}. His aeronautical engineering background brings a strong analytical and problem-solving perspective to mobile software architecture.`;
      }
    },

    // ── HOBBIES & INTERESTS (Mapped to About) ──────────────────
    {
      name: "ABOUT_VINAY",
      weight: 14,
      section: "about",
      targetItem: { type: "hobbies", id: "hobbies-container" },
      keywords: ["hobbies", "hobby", "interests", "interest", "free time", "outside work", "music", "video editing", "cinema"],
      answer: () => `Outside of mobile engineering, Vinay creates original music, edits videos, designs digital art, and has a deep passion for cinema and filmmaking.`
    },
    {
      name: "ABOUT_VINAY",
      weight: 14,
      section: "about",
      keywords: ["location", "where is vinay from", "where does vinay live", "where is he based", "bangalore"],
      answer: () => `Vinay is based in ${VITH_KNOWLEDGE.owner.location}.`
    }
  ],

  // ── FALLBACK ─────────────────────────────────────────────────
  fallback: [
    `I don't have information on that in my database. As Vinay's AI portfolio assistant, I can answer questions about his React Native experience, technical skills, projects, and background.`,
    `That is outside my current knowledge base. Try asking about Vinay's skills, his projects like VINXO, or his work at Esyasoft and Perisync.`,
    `Query not recognized in my portfolio database. Feel free to ask about Vinay's technical expertise, professional background, or how to contact him.`
  ],

  // Full intent processor: returns speech text AND navigation routing metadata
  processQuery(query) {
    if (!query || !query.trim()) {
      return {
        text: this.fallback[0],
        intent: "EMPTY",
        sectionId: null,
        targetItem: null,
        shouldNavigate: false,
        shouldOpenModal: false
      };
    }

    const cleanQuery = query.trim();
    const q = this.normalizeQuery(cleanQuery);
    const wantsModalOpen = this.checkModalOpenIntent(cleanQuery);

    // 1. First, check for ordinal project queries ("second project", "1st project", etc.)
    const ordinalMatch = this.resolveOrdinalProject(cleanQuery);
    if (ordinalMatch) {
      const p = ordinalMatch.project;
      const speechText = `The ${ordinalMatch.ordinalWord} project in Vinay's portfolio is ${p.name}. ${p.description} Key highlights include: ${(p.highlights || []).slice(0, 3).join("; ")}. Built using ${(p.tech || []).slice(0, 4).join(", ")}.`;
      return {
        text: speechText,
        intent: "PROJECT_SPECIFIC",
        sectionId: "projects",
        targetItem: { type: "project", id: p.id, index: ordinalMatch.index, project: p },
        shouldNavigate: true,
        shouldOpenModal: wantsModalOpen
      };
    }

    // 2. Score patterns using padded whole-phrase matching
    const paddedQ = " " + q + " ";
    const hasSpecificIntent = this.patterns.some(pattern =>
      !pattern.fallbackWhenOtherIntent &&
      pattern.section &&
      pattern.keywords.some(kw => paddedQ.includes(" " + kw + " "))
    );
    let bestPattern = null;
    let highestScore = 0;

    for (const pattern of this.patterns) {
      if (pattern.fallbackWhenOtherIntent && hasSpecificIntent) continue;

      let score = 0;
      for (const kw of pattern.keywords) {
        if (paddedQ.includes(" " + kw + " ")) {
          const matchScore = (pattern.weight || 10) * 100 + kw.length * 10;
          if (matchScore > score) {
            score = matchScore;
          }
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestPattern = pattern;
      }
    }

    if (bestPattern && highestScore > 0) {
      const answerText = typeof bestPattern.answer === "function" ? bestPattern.answer() : bestPattern.answer;
      const isProjectTarget = bestPattern.targetItem && bestPattern.targetItem.type === "project";
      return {
        text: answerText,
        intent: bestPattern.name,
        sectionId: bestPattern.section || null,
        targetItem: bestPattern.targetItem || null,
        shouldNavigate: Boolean(bestPattern.section),
        shouldOpenModal: Boolean(isProjectTarget && wantsModalOpen)
      };
    }

    // Fallback response: no navigation
    return {
      text: this.fallback[Math.floor(Math.random() * this.fallback.length)],
      intent: "FALLBACK",
      sectionId: null,
      targetItem: null,
      shouldNavigate: false,
      shouldOpenModal: false
    };
  },

  // Backwards-compatible respond(): returns plain string
  respond(query) {
    const res = this.processQuery(query);
    return res ? res.text : this.fallback[0];
  }
};
