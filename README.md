# VITH — Intelligent Voice-Guided Holographic Portfolio

> **"Vinay Is The Hero"** — An AI-powered, holographic portfolio assistant inspired by Tony Stark's EDITH, presenting the professional engineering work of **Vinay Kumar B**.

---

## 🌟 Overview

**VITH** is a futuristic, holographic AI portfolio interface. Powered by an on-device conversational intelligence engine and voice pipeline, VITH acts as a personal digital guide. Website visitors can talk to VITH or type queries to explore Vinay's background, technical skills, production experience, and mobile applications with automated viewport navigation and card highlighting.

---

## ✨ Key Features

### 1. 🤖 Identity-Aware AI Portfolio Assistant (`VITH`)
* **Strict First vs. Third Person Identity Model**: VITH consistently speaks in the first person (*"I am VITH, Vinay's personal AI portfolio assistant..."*) while referring to Vinay Kumar strictly in the third person (*"Vinay is a Senior React Native Developer..."*). VITH never impersonates Vinay or conflates assistant and creator identities.
* **Separated Query Intents**:
  * `VITH_INTRO`: Answers questions like *"Tell me about yourself"*, *"Who are you?"*, or *"What is your name?"* conversationally without navigating.
  * `VITH_CAPABILITIES`: Explains voice and portfolio guidance capabilities without scrolling.
  * `GREETINGS`: Responsive greetings (*"Hello"*, *"Hi"*, *"Good morning"*).
  * `ABOUT_VINAY`: Introduces Vinay's professional background and navigates to the **About** section.
  * `SKILLS`: Detailed overview of Vinay's tech stack and navigates to **Skills**.
  * `EXPERIENCE`: Summarizes career history and navigates to **Experience**.
  * `CURRENT_JOB`: Details work at **Esyasoft Smart Research**, navigating and highlighting the Esyasoft experience card.
  * `PREVIOUS_COMPANY`: Details work at **Perisync Technology**, navigating and highlighting the Perisync experience card.
  * `PROJECTS`: High-level summary of built applications and navigates to **Projects**.
  * `PROJECT_SPECIFIC`: Dedicated breakdown for identifiable projects (e.g., **VINXO**, **WFM**, **Consumer Utility**, **Pomodoro**, or ordinals like *"second project"*), highlighting the target project card.
  * `CONTACT`: Direct contact channels (Email, GitHub, Location) and navigates to **Contact**.
  * `ACHIEVEMENTS`: Spoken review of verified milestones without unnecessary scrolling.
  * `FALLBACK`: Graceful guidance when answering questions outside portfolio scope.

### 2. 🧭 Intelligent Navigation & Highlighting
* **Unobstructed Viewport Clearance**: Automatically computes target scroll positions accounting for both the top HUD navbar and the bottom floating assistant capsule, ensuring headings and cards are never obscured.
* **Target Card Highlighting**: Center-scrolls and applies a temporary cyan/gold holographic pulse (`.vith-highlight-card` / `.vith-highlight-section`) to targeted projects or timeline cards.
* **Smart Visibility Checks**: Detects if an element is already in the viewport to avoid disruptive jumps on follow-up queries.
* **Accessibility / Reduced Motion**: Fully respects `prefers-reduced-motion: reduce` system preferences.

### 3. 🎙️ Voice & Audio Pipeline
* **Real-time Speech Recognition (STT)**: Uses Web Speech API with live transcript streaming into the assistant input.
* **Automatic 1.8s Silence Auto-Submit**: Intelligent pause detection automatically submits speech after 1.8 seconds of silence without requiring manual button clicks.
* **Text-to-Speech (TTS)**: Voice responses powered by Web Speech Synthesis with natural utterance scheduling and ElevenLabs architecture compatibility.
* **Audio Feedback Loop Prevention**: Automatically pauses microphone recognition while VITH is speaking to prevent self-hearing.

### 4. 🗂️ Conversation Intel History Panel
* **Dedicated History Access**: Quick-access button with an unread query count badge situated right by the input controls.
* **Cybernetic Dossier Modal**: Full query and response audit log with timestamps.
* **Replay Audio**: Re-listen to any past VITH voice intel response.
* **Session Persistence**: Maintains conversation history within session storage.

### 5. 🔬 Declassified Holographic Project Modals
* **Project Cards**: Displays project metadata, category tags, technology badges, and key production bullet points.
* **Deep-Dive Modals**: Full-screen dossier view featuring complete tech stack chips, operational details, and direct GitHub repository links.
* **Ordinal Resolution**: Understands queries like *"tell me about your second project"* or *"open the first project"*.

### 6. 🎨 Stark-Tech Holographic Visual Identity
* **Dynamic Canvas Particles**: Constellation-style glowing ambient particle network.
* **Arc Reactor Core & Visualizer**: Multi-ring animated holographic avatar with real-time audio waveform equalizer bars.
* **Futuristic HUD Aesthetics**: Scanline overlays, glowing cybernetic borders, cyan (`#00d4ff`) and amber (`#ffaa00`) accents.

---

## 📁 Repository Structure

```
Vinay_Portfolio/
├── index.html              # Core HTML structure, HUD overlays, modals & sections
├── style.css               # Holographic cyberpunk styling, animations & theme
├── app.js                  # Main controller: navigation, particles, DOM & modals
├── voice-engine.js         # STT & TTS engine, silence detection, mic manager
├── knowledge-base.js       # Single source of truth: Vinay's data & VITH Q&A engine
├── screenshots/            # Portfolio preview media
├── .gitignore              # Ignores node_modules, temp files, and OS caches
├── package.json            # Project dependencies
└── README.md               # Documentation & usage guide
```

---

## 🚀 Quick Start

### Option A: Local HTTP Server (Recommended)
Because modern browsers require HTTPS or `localhost` for microphone permissions (SpeechRecognition), run a local server:

**Using Python:**
```bash
python -m http.server 8080
```
Then open: **`http://localhost:8080`**

**Using Node.js:**
```bash
npx serve .
```

**Using VS Code:**
Install the **Live Server** extension and click **"Go Live"** (default port: `5500`).

---

## 🎤 Microphone & Voice Setup

1. **Browser Support**: For speech-to-text recognition, use **Google Chrome** or **Microsoft Edge**.
2. **Microphone Permissions**:
   * When prompted, click **Allow** for microphone access.
   * If blocked, click the 🔒 lock icon in the browser address bar, set **Microphone** to **Allow**, and refresh.
   * Ensure your system's default input device is set to your active physical microphone (not *Stereo Mix*).

---

## 📝 Customizing Portfolio Data

All personal and technical data is driven from a single source of truth in **`knowledge-base.js`**:

```javascript
const VITH_KNOWLEDGE = {
  owner: { /* Bio, links, contact, location */ },
  skills: { /* Technical and soft skills */ },
  experience: [ /* Companies, roles, achievements */ ],
  projects: [ /* Production apps, personal companions */ ],
  achievements: [ /* App Store deployments, enterprise modules */ ],
  vithPersonality: { /* Greetings, intro script, catchphrases */ }
};
```

To update questions and responses, modify the `patterns` array in `VITH_QA` inside [knowledge-base.js](file:///C:/VITH-Portfolio/knowledge-base.js).

---

## 🌐 Deployment

### GitHub Pages
1. Push this repository to GitHub:
   ```bash
   git push -u origin main
   ```
2. In your GitHub repository, go to **Settings** → **Pages**.
3. Under **Branch**, select `main` (root) and click **Save**.
4. Your VITH portfolio will be live at:
   `https://<username>.github.io/<repository-name>/`

---

## 👨‍💻 Author

**Vinay Kumar B**  
*Senior React Native Developer*  
* 📍 Bangalore, India  
* ✉️ [vinaykumarb865@gmail.com](mailto:vinaykumarb865@gmail.com)  
* 🐙 [GitHub: Vinay-ReactNative](https://github.com/Vinay-ReactNative)  

---

*Inspired by Tony Stark's EDITH. Engineered by Vinay. Powered by VITH.*
