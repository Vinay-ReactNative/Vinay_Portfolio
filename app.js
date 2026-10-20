/**
 * VITH Main Application Logic
 * Particles, Scroll Animations, Skill Bars, VITH Chat UI
 */

// ── DOM Ready ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  VITHVoice.init();
  initParticles();
  initNavbar();
  initIntro();
  initPortfolioSections();
  initScrollAnimations();
  initVITHPanel();
});

// ══════════════════════════════════════════════════════════════
//  PARTICLES
// ══════════════════════════════════════════════════════════════
function initParticles() {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let particles = [];
  const COUNT = 60;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.hue = Math.random() > 0.8 ? 45 : 195; // gold or cyan
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > canvas.width ||
          this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = `hsl(${this.hue}, 100%, 70%)`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `hsl(${this.hue}, 100%, 70%)`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  // Draw connecting lines
  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 120) * 0.08;
          ctx.strokeStyle = "#00d4ff";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    requestAnimationFrame(animate);
  }
  animate();
}

// ══════════════════════════════════════════════════════════════
//  NAVBAR
// ══════════════════════════════════════════════════════════════
function initNavbar() {
  const nav = document.getElementById("navbar");
  const links = document.querySelectorAll(".nav-links a");

  window.addEventListener("scroll", () => {
    nav.style.background = window.scrollY > 50
      ? "rgba(0, 4, 8, 0.95)"
      : "rgba(0, 4, 8, 0.8)";

    // Active link tracking
    const sections = document.querySelectorAll("section[id]");
    let current = "";
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 100) current = s.id;
    });
    links.forEach(l => {
      l.classList.toggle("active", l.getAttribute("href") === `#${current}`);
    });
  });

  // Smooth nav click
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

// ══════════════════════════════════════════════════════════════
//  INTRO SEQUENCE
// ══════════════════════════════════════════════════════════════
function initIntro() {
  const overlay = document.getElementById("vith-intro");
  const msgEl = document.getElementById("intro-message");
  const progressBar = document.getElementById("intro-progress-bar");
  const skipBtn = document.getElementById("intro-skip");
  const startBtn = document.getElementById("intro-start-btn");
  const introVizBars = Array.from(document.querySelectorAll("#intro-visualizer .viz-bar"));

  const introText = VITH_KNOWLEDGE.vithPersonality.introScript;
  let done = false;
  let introStarted = false;
  let vizInterval = null;

  function startIntroViz() {
    clearInterval(vizInterval);
    vizInterval = setInterval(() => {
      if (!VITHVoice.isSpeaking || done) {
        introVizBars.forEach(b => { b.style.height = "6px"; });
        return;
      }
      introVizBars.forEach((bar, i) => {
        const h = 5 + Math.abs(Math.sin(Date.now() / 130 + i * 0.7)) * 22;
        bar.style.height = h + "px";
      });
    }, 50);
  }

  // Type the intro message
  let idx = 0;
  const typeSpeed = 25; // ms per character

  function typeNext() {
    if (done) return;
    if (idx <= introText.length) {
      msgEl.textContent = introText.slice(0, idx);
      idx++;
      const pct = (idx / introText.length) * 100;
      if (progressBar) progressBar.style.width = pct + "%";
      setTimeout(typeNext, typeSpeed);
    } else {
      // Done typing — wait for voice to finish speaking before auto-closing
      const pollVoiceEnd = () => {
        if (done) return;
        if (!VITHVoice.isSpeaking) {
          setTimeout(closeIntro, 1500);
        } else {
          setTimeout(pollVoiceEnd, 500);
        }
      };
      pollVoiceEnd();
    }
  }

  function startIntro() {
    if (introStarted || done) return;
    introStarted = true;

    // Guaranteed user interaction: unlock Web Audio and SpeechSynthesis
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const aCtx = new AudioCtx();
        aCtx.resume();
      }
    } catch (e) {}

    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
      } catch (e) {}
    }

    if (startBtn) {
      startBtn.classList.add("fade-out");
      setTimeout(() => {
        if (startBtn) startBtn.style.display = "none";
      }, 400);
    }

    // Start intro visualizer pulsing
    startIntroViz();

    // Speak the intro out loud
    VITHVoice.speak(introText);
    typeNext();
  }

  // Click on start button, or click anywhere on the overlay, or press any key
  if (startBtn) {
    startBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      startIntro();
    });
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === skipBtn || skipBtn.contains(e.target)) return;
    startIntro();
  });

  const onKey = (e) => {
    if (!introStarted && !done) {
      startIntro();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);

  function closeIntro() {
    if (done) return;
    done = true;
    clearInterval(vizInterval);
    VITHVoice.stopSpeaking();
    overlay.classList.add("hidden");
    setTimeout(() => { overlay.remove(); }, 900);
  }

  skipBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeIntro();
  });
}

// ══════════════════════════════════════════════════════════════
//  BUILD PORTFOLIO SECTIONS FROM KNOWLEDGE BASE
// ══════════════════════════════════════════════════════════════
function initPortfolioSections() {
  buildSkills();
  buildExperience();
  buildProjects();
  buildContact();
}

function buildSkills() {
  const container = document.getElementById("skills-grid");
  if (!container) return;
  container.innerHTML = "";

  // Group skills by category
  const grouped = {};
  VITH_KNOWLEDGE.skills.technical.forEach(skill => {
    if (!grouped[skill.category]) grouped[skill.category] = [];
    grouped[skill.category].push(skill.name);
  });

  Object.entries(grouped).forEach(([category, skills]) => {
    const categoryBlock = document.createElement("div");
    categoryBlock.className = "skill-category-block holo-card fade-in";
    categoryBlock.innerHTML = `
      <div class="skill-category-label">${category}</div>
      <div class="skill-tags">
        ${skills.map(s => `<span class="skill-tag">${s}</span>`).join("")}
      </div>`;
    container.appendChild(categoryBlock);
  });
}

function buildExperience() {
  const container = document.getElementById("experience-timeline");
  if (!container) return;
  container.innerHTML = "";
  VITH_KNOWLEDGE.experience.forEach((exp, idx) => {
    const highlights = exp.highlights.slice(0, 3).map(h => `<li>${h}</li>`).join("");
    const card = document.createElement("div");
    card.className = "timeline-item holo-card fade-in";
    card.id = `experience-card-${idx}`;
    card.dataset.company = exp.company.toLowerCase();
    card.dataset.experienceIndex = idx;
    card.innerHTML = `
        <div class="timeline-period">${exp.period} · ${exp.location}</div>
        <div class="timeline-role">${exp.role}</div>
        <div class="timeline-company">${exp.company}</div>
        <ul class="timeline-highlights">${highlights}</ul>
        <div class="experience-card-footer">
          <button type="button" class="project-intel-cta experience-view-btn">
            <span>VIEW EXPERIENCE</span>
            <span class="intel-cta-arrow" aria-hidden="true">↗</span>
          </button>
        </div>`;
    card.querySelector(".experience-view-btn").addEventListener("click", () => openExperienceModal(exp));
    container.appendChild(card);
  });
}

function buildProjects() {
  const container = document.getElementById("projects-grid");
  if (!container) return;
  container.innerHTML = "";

  VITH_KNOWLEDGE.projects.forEach((p, idx) => {
    const featured = p.featured ? '<span class="project-badge">★ FEATURED</span>' : "";
    const category = p.category ? `<span class="project-category-tag">${p.category}</span>` : "";
    
    // Top 3 preview tech chips
    const previewTech = (p.tech || []).slice(0, 3).map(t => `<span class="tech-tag">${t}</span>`).join("");
    const moreCount = (p.tech || []).length - 3;
    const moreBadge = moreCount > 0 ? `<span class="tech-tag tech-tag-more">+${moreCount} more</span>` : "";

    // Main 2-3 crisp bullet points
    const pointsList = (p.highlights || []).slice(0, 3).map(pt => `
      <li class="project-point">
        <span class="point-bullet">▸</span>
        <span class="point-text">${pt}</span>
      </li>
    `).join("");

    const card = document.createElement("div");
    card.className = "holo-card project-card fade-in";
    card.id = `project-card-${p.id}`;
    card.dataset.projectId = p.id;
    card.dataset.projectIndex = idx;
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `View intel dossier for ${p.name}`);

    card.innerHTML = `
      <div class="project-card-header">
        <div class="project-card-title-group">
          <div class="project-company-tag">// ${p.company.toUpperCase()}</div>
          <h3 class="project-name">${p.name}</h3>
        </div>
        <div class="project-badges-group">
          ${featured}
          ${category}
        </div>
      </div>

      <ul class="project-points-list">
        ${pointsList}
      </ul>

      <div class="project-card-footer">
        <div class="project-tech-preview">
          ${previewTech}
          ${moreBadge}
        </div>
        <div class="project-intel-cta">
          <span class="intel-cta-text">VIEW INTEL</span>
          <span class="intel-cta-arrow">↗</span>
        </div>
      </div>
    `;

    // Click anywhere on card or press Enter to open holographic modal
    card.addEventListener("click", () => openProjectModal(p));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProjectModal(p);
      }
    });

    container.appendChild(card);
  });

  // Wire up modal backdrop & close events once
  initProjectModalEvents();
}

// ── Holographic Project Modal Controller ────────────────────
let modalEventsInitialized = false;

function initProjectModalEvents() {
  if (modalEventsInitialized) return;
  modalEventsInitialized = true;

  const backdrop = document.getElementById("project-modal-backdrop");
  const closeBtn = document.getElementById("modal-close-btn");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeProjectModal);
  }

  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      // Click on backdrop outside modal dialog closes it
      if (e.target === backdrop) {
        closeProjectModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && backdrop && !backdrop.classList.contains("hidden")) {
      closeProjectModal();
    }
  });
}

function openProjectModal(project) {
  const backdrop = document.getElementById("project-modal-backdrop");
  const modalBody = document.getElementById("modal-body");
  const statusBadge = document.getElementById("modal-status-badge");
  const hudTag = document.getElementById("modal-hud-tag");
  if (!backdrop || !modalBody) return;

  if (hudTag) {
    hudTag.textContent = "// STARK_TECH_VAULT // INTEL_DOSSIER";
  }
  if (statusBadge) {
    statusBadge.textContent = project.status ? project.status.toUpperCase() : "DECLASSIFIED";
  }

  const allTags = (project.tech || []).map(t => `<span class="tech-tag modal-tech-chip">${t}</span>`).join("");
  const allHighlights = (project.highlights || []).map(h => `
    <li class="modal-highlight-item">
      <span class="modal-highlight-arrow">▸</span>
      <span class="modal-highlight-text">${h}</span>
    </li>
  `).join("");

  const githubBtn = project.github
    ? `<a href="${project.github}" target="_blank" rel="noopener noreferrer" class="btn-holo btn-holo-solid modal-action-btn">
         <span class="btn-icon">⌥</span> GITHUB REPOSITORY ↗
       </a>`
    : "";

  const liveBtn = project.link
    ? `<a href="${project.link}" target="_blank" rel="noopener noreferrer" class="btn-holo modal-action-btn">
         <span class="btn-icon">↗</span> LIVE DEMO
       </a>`
    : "";

  modalBody.innerHTML = `
    <div class="modal-project-masthead">
      <div class="modal-company-eyebrow">// ${project.company.toUpperCase()}</div>
      <h2 class="modal-project-heading" id="modal-project-title">${project.name}</h2>
      <div class="modal-badges-strip">
        ${project.category ? `<span class="modal-badge-pill cyan">📁 ${project.category}</span>` : ""}
        ${project.featured ? `<span class="modal-badge-pill gold">★ FEATURED PROJECT</span>` : ""}
        ${project.status ? `<span class="modal-badge-pill status">⚡ ${project.status}</span>` : ""}
      </div>
    </div>

    <div class="modal-section-card">
      <div class="modal-section-title">
        <span class="modal-section-icon">⬡</span>
        <span>CORE ARCHITECTURE &amp; KEY DELIVERABLES</span>
      </div>
      <ul class="modal-highlights-container">
        ${allHighlights}
      </ul>
    </div>

    <div class="modal-section-card">
      <div class="modal-section-title">
        <span class="modal-section-icon">⬡</span>
        <span>MISSION BRIEF &amp; FULL OVERVIEW</span>
      </div>
      <div class="modal-full-desc">${project.description}</div>
    </div>

    <div class="modal-section-card">
      <div class="modal-section-title">
        <span class="modal-section-icon">⬡</span>
        <span>INTEGRATED SYSTEM TECHNOLOGIES</span>
      </div>
      <div class="modal-tech-stack">
        ${allTags}
      </div>
    </div>

    <div class="modal-footer-toolbar">
      <div class="modal-links-row">
        ${githubBtn}
        ${liveBtn}
        <button type="button" class="btn-holo modal-ask-btn" id="modal-ask-vith-btn">
          <span>💬</span> ASK VITH ABOUT THIS
        </button>
      </div>
      <button type="button" class="modal-close-action" id="modal-close-action-btn">
        [ CLOSE INTEL ]
      </button>
    </div>
  `;

  // "Ask Vith about this project"
  const askBtn = document.getElementById("modal-ask-vith-btn");
  if (askBtn) {
    askBtn.addEventListener("click", () => {
      closeProjectModal();
      const query = `Tell me about ${project.name}`;
      const textInput = document.getElementById("vith-text-input");
      if (textInput) {
        textInput.value = query;
        textInput.focus();
      }
      setTimeout(() => {
        const sendBtn = document.getElementById("vith-send");
        if (sendBtn) sendBtn.click();
      }, 350);
    });
  }

  const dismissBtn = document.getElementById("modal-close-action-btn");
  if (dismissBtn) {
    dismissBtn.addEventListener("click", closeProjectModal);
  }

  backdrop.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function openExperienceModal(experience) {
  const backdrop = document.getElementById("project-modal-backdrop");
  const modalBody = document.getElementById("modal-body");
  const statusBadge = document.getElementById("modal-status-badge");
  const hudTag = document.getElementById("modal-hud-tag");
  if (!backdrop || !modalBody) return;

  if (hudTag) {
    hudTag.textContent = "// WORK_EXPERIENCE // ROLE_DOSSIER";
  }
  if (statusBadge) {
    statusBadge.textContent = experience.duration.toUpperCase();
  }

  const allHighlights = experience.highlights.map(h => `
    <li class="modal-highlight-item">
      <span class="modal-highlight-arrow">▸</span>
      <span class="modal-highlight-text">${h}</span>
    </li>
  `).join("");
  const projects = experience.projects.map(project => `<span class="tech-tag modal-tech-chip">${project}</span>`).join("");

  modalBody.innerHTML = `
    <div class="modal-project-masthead">
      <div class="modal-company-eyebrow">// ${experience.company.toUpperCase()}</div>
      <h2 class="modal-project-heading" id="modal-project-title">${experience.role}</h2>
      <div class="modal-badges-strip">
        <span class="modal-badge-pill cyan">📍 ${experience.location}</span>
        <span class="modal-badge-pill status">⚡ ${experience.period}</span>
      </div>
    </div>

    <div class="modal-section-card">
      <div class="modal-section-title">
        <span class="modal-section-icon">⬡</span>
        <span>KEY RESPONSIBILITIES &amp; CONTRIBUTIONS</span>
      </div>
      <ul class="modal-highlights-container">
        ${allHighlights}
      </ul>
    </div>

    <div class="modal-section-card">
      <div class="modal-section-title">
        <span class="modal-section-icon">⬡</span>
        <span>ROLE OVERVIEW</span>
      </div>
      <div class="modal-full-desc">${experience.description}</div>
    </div>

    <div class="modal-section-card">
      <div class="modal-section-title">
        <span class="modal-section-icon">⬡</span>
        <span>PROJECTS &amp; AREAS</span>
      </div>
      <div class="modal-tech-stack">
        ${projects}
      </div>
    </div>

    <div class="modal-footer-toolbar">
      <button type="button" class="modal-close-action" id="modal-close-action-btn">
        [ CLOSE EXPERIENCE ]
      </button>
    </div>
  `;

  const dismissBtn = document.getElementById("modal-close-action-btn");
  if (dismissBtn) {
    dismissBtn.addEventListener("click", closeProjectModal);
  }

  backdrop.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeProjectModal() {
  const backdrop = document.getElementById("project-modal-backdrop");
  if (!backdrop) return;
  backdrop.classList.add("hidden");
  const historyModal = document.getElementById("history-modal-backdrop");
  if (!historyModal || historyModal.classList.contains("hidden")) {
    document.body.classList.remove("modal-open");
  }
}

function buildContact() {
  const container = document.getElementById("contact-grid");
  if (!container) return;
  const { email, github, linkedin, twitter } = VITH_KNOWLEDGE.owner;
  const items = [
    { icon: "✉", label: "EMAIL", value: email, href: `mailto:${email}` },
    { icon: "⌥", label: "GITHUB", value: "github.com/vinay", href: github },
    { icon: "in", label: "LINKEDIN", value: "linkedin/vinay", href: linkedin },
    twitter ? { icon: "𝕏", label: "TWITTER", value: "@vinay", href: twitter } : null
  ].filter(Boolean);

  container.innerHTML = items.map(item => `
    <a href="${item.href}" target="_blank" class="holo-card contact-item fade-in">
      <div class="contact-icon">${item.icon}</div>
      <div class="contact-label">${item.label}</div>
      <div class="contact-value">${item.value}</div>
    </a>`).join("");
}

// ══════════════════════════════════════════════════════════════
//  SCROLL ANIMATIONS + SKILL BAR REVEAL
// ══════════════════════════════════════════════════════════════
function initScrollAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");

        // Animate skill bars
        entry.target.querySelectorAll(".skill-bar-fill").forEach(bar => {
          const level = bar.dataset.level;
          setTimeout(() => { bar.style.width = level + "%"; }, 100);
        });
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".fade-in").forEach(el => obs.observe(el));
}

// ══════════════════════════════════════════════════════════════
//  VITH INTELLIGENT VOICE-GUIDED NAVIGATION & CONTENT HIGHLIGHTING
// ══════════════════════════════════════════════════════════════
let currentHighlightTimer = null;
let activeHighlightedElement = null;

function clearActiveHighlight() {
  if (currentHighlightTimer) {
    clearTimeout(currentHighlightTimer);
    currentHighlightTimer = null;
  }
  if (activeHighlightedElement) {
    activeHighlightedElement.classList.remove("vith-highlight-card", "vith-highlight-section");
    activeHighlightedElement = null;
  }
}

function applyHighlight(element, type = "section") {
  if (!element) return;
  clearActiveHighlight();

  activeHighlightedElement = element;
  const highlightClass = type === "card" ? "vith-highlight-card" : "vith-highlight-section";
  element.classList.add(highlightClass);

  // Auto remove after 2.8s
  currentHighlightTimer = setTimeout(() => {
    if (activeHighlightedElement === element) {
      element.classList.remove(highlightClass);
      activeHighlightedElement = null;
    }
    currentHighlightTimer = null;
  }, 2800);
}

function isElementInViewport(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const navbar = document.getElementById("navbar");
  const navHeight = navbar ? navbar.offsetHeight : 70;
  const capsule = document.getElementById("vith-capsule");
  const capsuleHeight = capsule ? capsule.offsetHeight + 35 : 95;

  const topLimit = navHeight + 10;
  const bottomLimit = windowHeight - capsuleHeight;

  // Fully or comfortably visible within the unobstructed viewing area
  return (
    rect.top >= topLimit - 40 &&
    rect.top <= bottomLimit &&
    rect.bottom > topLimit
  );
}

function scrollToDestination(targetElement) {
  if (!targetElement) return;

  const navbar = document.getElementById("navbar");
  const navHeight = navbar ? navbar.offsetHeight : 70;
  const capsule = document.getElementById("vith-capsule");
  const capsuleHeight = capsule ? capsule.offsetHeight + 35 : 95;

  const rect = targetElement.getBoundingClientRect();
  const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
  const elementAbsoluteTop = currentScrollY + rect.top;
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const visibleAreaHeight = windowHeight - navHeight - capsuleHeight;

  let targetScrollY;
  const isCard = targetElement.classList.contains("project-card") || targetElement.classList.contains("timeline-item");

  if (isCard) {
    if (rect.height < visibleAreaHeight) {
      // Center the card vertically in the clear zone between navbar and bottom capsule
      const topMargin = navHeight + Math.round((visibleAreaHeight - rect.height) / 2);
      targetScrollY = elementAbsoluteTop - topMargin;
    } else {
      targetScrollY = elementAbsoluteTop - (navHeight + 20);
    }
  } else {
    // For sections, align the section header with generous padding below the navbar
    targetScrollY = elementAbsoluteTop - (navHeight + 20);
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.scrollTo({
    top: Math.max(0, Math.round(targetScrollY)),
    behavior: prefersReducedMotion ? "auto" : "smooth"
  });
}

function navigateAndHighlight(sectionId, targetItem = null, shouldOpenModal = false) {
  if (!sectionId) return;

  const targetSection = document.getElementById(sectionId);
  if (!targetSection) return;

  let elementToHighlight = null;
  let targetCardElement = null;

  if (targetItem && targetItem.type === "project") {
    if (targetItem.id) {
      targetCardElement = document.querySelector(`.project-card[data-project-id="${targetItem.id}"]`) ||
                          document.getElementById(`project-card-${targetItem.id}`);
    }
    if (!targetCardElement && typeof targetItem.index === "number") {
      const cards = document.querySelectorAll("#projects-grid .project-card");
      targetCardElement = cards[targetItem.index];
    }
    elementToHighlight = targetCardElement || targetSection.querySelector(".section-header") || targetSection;
  } else if (targetItem && targetItem.type === "experience") {
    if (targetItem.company) {
      targetCardElement = document.querySelector(`.timeline-item[data-company*="${targetItem.company.toLowerCase()}"]`);
    }
    if (!targetCardElement && typeof targetItem.index === "number") {
      const cards = document.querySelectorAll("#experience-timeline .timeline-item");
      targetCardElement = cards[targetItem.index];
    }
    elementToHighlight = targetCardElement || targetSection.querySelector(".section-header") || targetSection;
  } else if (targetItem && targetItem.id) {
    const el = document.getElementById(targetItem.id);
    elementToHighlight = el || targetSection.querySelector(".section-header") || targetSection;
  } else {
    elementToHighlight = targetSection.querySelector(".section-header") || targetSection;
  }

  // Handle explicit open modal requests (e.g. "open second project")
  if (shouldOpenModal && targetItem && targetItem.type === "project") {
    const project = targetItem.project || (typeof targetItem.index === "number" ? VITH_KNOWLEDGE.projects[targetItem.index] : null);
    if (project) {
      openProjectModal(project);
      return;
    }
  }

  // Check if destination is already visible (avoids unnecessary jump on follow-up queries)
  const isAlreadyVisible = isElementInViewport(elementToHighlight || targetSection);

  if (!isAlreadyVisible) {
    scrollToDestination(targetCardElement || targetSection);
  }

  // Apply visual highlight
  applyHighlight(elementToHighlight, targetCardElement ? "card" : "section");
}

// ══════════════════════════════════════════════════════════════
//  VITH CAPSULE — Slim bottom bar with fixed mic + chat bubbles
// ══════════════════════════════════════════════════════════════
function initVITHPanel() {
  const capsule        = document.getElementById("vith-capsule");
  const msgStrip       = document.getElementById("vith-messages");
  const textInput      = document.getElementById("vith-text-input");
  const sendBtn        = document.getElementById("vith-send");
  const micBtn         = document.getElementById("vith-mic");
  const stopBtn        = document.getElementById("vith-stop-btn");
  const voiceToggleBtn = document.getElementById("vith-voice-toggle");
  const voiceChip      = document.getElementById("vith-voice-chip");
  const historyBtn     = document.getElementById("vith-history-btn");
  const historyBadge   = document.getElementById("vith-history-badge");
  const dot            = document.getElementById("vith-indicator");
  const vithCore       = document.getElementById("vith-core");
  const vizBars        = Array.from(document.querySelectorAll("#capsule-viz .viz-bar"));

  // History modal elements
  const historyModal      = document.getElementById("history-modal-backdrop");
  const historyModalBody  = document.getElementById("history-modal-body");
  const historyCloseBtn   = document.getElementById("history-close-btn");
  const historyClearBtn   = document.getElementById("history-clear-btn");
  const historyCountBadge = document.getElementById("history-count-badge");

  // ── Conversation Intel History ─────────────────────────────
  let chatHistory = [];
  try {
    const saved = sessionStorage.getItem("vith_chat_history");
    if (saved) {
      chatHistory = JSON.parse(saved);
    }
  } catch (e) {}

  function saveChatHistory() {
    try {
      sessionStorage.setItem("vith_chat_history", JSON.stringify(chatHistory));
    } catch (e) {}
  }

  function updateHistoryBadge() {
    const count = chatHistory.length;
    if (historyBadge) {
      if (count > 0) {
        historyBadge.textContent = count > 99 ? "99+" : count;
        historyBadge.classList.remove("hidden");
      } else {
        historyBadge.classList.add("hidden");
      }
    }
    if (historyCountBadge) {
      historyCountBadge.textContent = `${count} ${count === 1 ? "QUERY" : "QUERIES"}`;
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function isHistoryModalOpen() {
    return historyModal && !historyModal.classList.contains("hidden");
  }

  function renderHistoryModal() {
    if (!historyModalBody) return;
    updateHistoryBadge();

    if (!chatHistory.length) {
      historyModalBody.innerHTML = `
        <div class="history-empty-state">
          <div class="history-empty-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          </div>
          <div class="history-empty-title">NO QUERIES RECORDED</div>
          <div class="history-empty-desc">
            Your conversations with VITH will be logged here. Ask anything about Vinay's projects, experience, or skills using voice or text.
          </div>
          <div class="history-empty-hint">
            PRO TIP: Click the mic button or type a query in the capsule bar to begin.
          </div>
        </div>
      `;
      return;
    }

    historyModalBody.innerHTML = chatHistory.map((item, idx) => `
      <div class="history-entry-card" data-index="${idx}">
        <!-- User Query -->
        <div class="history-user-block">
          <div class="history-meta-row">
            <span class="history-sender-tag user">// YOU</span>
            <span class="history-time-stamp">${item.time || ""}</span>
          </div>
          <div class="history-user-text">${escapeHtml(item.query)}</div>
        </div>

        <!-- VITH Reply -->
        <div class="history-vith-block">
          <div class="history-meta-row">
            <span class="history-sender-tag vith">// VITH COGNITIVE INTEL</span>
          </div>
          <div class="history-vith-text">${escapeHtml(item.answer)}</div>
          <div class="history-vith-actions">
            <button type="button" class="history-speak-btn" data-answer-index="${idx}">
              <span>🔊</span> REPLAY AUDIO
            </button>
          </div>
        </div>
      </div>
    `).join("");

    // Wire replay audio buttons
    historyModalBody.querySelectorAll(".history-speak-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const itemIdx = parseInt(btn.dataset.answerIndex, 10);
        if (chatHistory[itemIdx] && chatHistory[itemIdx].answer) {
          VITHVoice.speak(chatHistory[itemIdx].answer);
        }
      });
    });

    // Auto-scroll to latest
    setTimeout(() => {
      historyModalBody.scrollTop = historyModalBody.scrollHeight;
    }, 50);
  }

  function openHistoryModal() {
    if (!historyModal) return;
    renderHistoryModal();
    historyModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  function closeHistoryModal() {
    if (!historyModal) return;
    historyModal.classList.add("hidden");
    const projectModal = document.getElementById("project-modal-backdrop");
    if (!projectModal || projectModal.classList.contains("hidden")) {
      document.body.classList.remove("modal-open");
    }
  }

  if (historyBtn) {
    historyBtn.addEventListener("click", () => {
      if (isHistoryModalOpen()) {
        closeHistoryModal();
      } else {
        openHistoryModal();
      }
    });
  }

  if (historyCloseBtn) {
    historyCloseBtn.addEventListener("click", closeHistoryModal);
  }

  if (historyClearBtn) {
    historyClearBtn.addEventListener("click", () => {
      chatHistory = [];
      saveChatHistory();
      renderHistoryModal();
    });
  }

  if (historyModal) {
    historyModal.addEventListener("click", (e) => {
      if (e.target === historyModal) {
        closeHistoryModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (VITHVoice.isSpeaking) {
        console.log("[VITH] Escape pressed: stopping speech immediately.");
        VITHVoice.stopSpeaking();
        return;
      }
      if (isHistoryModalOpen()) {
        closeHistoryModal();
      }
    }
  });

  // Clicking avatar core while speaking acts as an emergency stop
  if (vithCore) {
    vithCore.addEventListener("click", () => {
      if (VITHVoice.isSpeaking) {
        console.log("[VITH] Avatar core clicked during speech: stopping playback.");
        VITHVoice.stopSpeaking();
      }
    });
  }

  // Dedicated Stop button in capsule bar
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      console.log("[VITH] Stop button clicked: stopping active speech.");
      VITHVoice.stopSpeaking();
    });
  }

  // ── Kokoro Neural TTS Status & Voice Toggle ────────────────
  function updateVoiceStatusChip(status, message) {
    if (!voiceChip) return;
    voiceChip.className = "capsule-voice-chip";

    const isEnabled = window.VITH_TTS ? window.VITH_TTS.voiceEnabled : true;
    if (!isEnabled) {
      voiceChip.classList.add("muted");
      voiceChip.textContent = "[VOICE MUTED]";
      voiceChip.title = "Voice output is muted. Click speaker button to enable.";
      return;
    }

    switch (status) {
      case "loading":
        voiceChip.classList.add("loading");
        const match = message ? message.match(/\d+%/) : null;
        voiceChip.textContent = match ? `[${match[0]}]` : "[LOADING VOICE...]";
        voiceChip.title = message || "Downloading Kokoro-82M voice model...";
        break;
      case "synthesizing":
        voiceChip.classList.add("loading");
        voiceChip.textContent = "[SYNTHESIZING]";
        voiceChip.title = "Kokoro.js generating speech audio...";
        break;
      case "playing":
        voiceChip.classList.add("speaking");
        voiceChip.textContent = "[SPEAKING]";
        voiceChip.title = "VITH speaking response (af_heart)";
        break;
      case "fallback":
        voiceChip.classList.add("fallback");
        voiceChip.textContent = "[BROWSER TTS]";
        voiceChip.title = "Browser SpeechSynthesis active";
        break;
      case "ready":
        const dev = window.VITH_TTS && window.VITH_TTS.device ? window.VITH_TTS.device.toUpperCase() : "AF_HEART";
        voiceChip.textContent = `[${dev}]`;
        voiceChip.title = message || "Kokoro.js af_heart neural voice ready";
        break;
      case "error":
        voiceChip.classList.add("fallback");
        voiceChip.textContent = "[SPEECH FALLBACK]";
        voiceChip.title = message || "Web Speech API fallback active";
        break;
      default:
        voiceChip.textContent = "[AF_HEART]";
        voiceChip.title = "Kokoro.js Neural Voice (af_heart)";
    }
  }

  function syncVoiceToggleUI() {
    const isEnabled = window.VITH_TTS ? window.VITH_TTS.voiceEnabled : true;
    if (voiceToggleBtn) {
      if (isEnabled) {
        voiceToggleBtn.classList.remove("voice-muted");
        voiceToggleBtn.title = "Voice Output: Active (Click to mute)";
      } else {
        voiceToggleBtn.classList.add("voice-muted");
        voiceToggleBtn.title = "Voice Output: Muted (Click to unmute)";
      }
    }
    updateVoiceStatusChip(window.VITH_TTS ? window.VITH_TTS.status : "ready");
  }

  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener("click", () => {
      if (window.VITH_TTS) {
        window.VITH_TTS.toggleVoice();
        syncVoiceToggleUI();
      }
    });
  }

  // Preload neural TTS on user intent (capsule hover or focus)
  const triggerPreload = () => {
    if (window.VITH_TTS && typeof window.VITH_TTS.preload === "function") {
      window.VITH_TTS.preload();
    }
  };
  capsule && capsule.addEventListener("mouseenter", triggerPreload, { once: true });
  textInput && textInput.addEventListener("focus", triggerPreload, { once: true });

  // Hook up TTS status updates
  const hookTTS = (ttsInstance) => {
    if (!ttsInstance) return;
    ttsInstance.onStatusChange = (status, msg) => {
      updateVoiceStatusChip(status, msg);
    };
    syncVoiceToggleUI();
  };

  if (window.VITH_TTS) {
    hookTTS(window.VITH_TTS);
  } else {
    window.addEventListener("vith-tts-ready", (e) => hookTTS(e.detail || window.VITH_TTS), { once: true });
  }

  updateHistoryBadge();

  // ── State ──────────────────────────────────────────────────
  let wantsToListen = false;
  let vizFrame = null;

  // ── Status helpers ─────────────────────────────────────────
  function setStatus(mode) {
    // mode: null | "listening" | "speaking"
    dot.className = "capsule-dot" + (mode ? " " + mode : "");
    capsule.className = mode || "";
  }

  // ── Waveform animator ──────────────────────────────────────
  function startViz(active) {
    cancelAnimationFrame(vizFrame);
    if (!active) {
      vizBars.forEach(b => { b.style.height = "4px"; b.style.opacity = "0.4"; });
      return;
    }
    function tick() {
      vizBars.forEach((b, i) => {
        const h = 4 + Math.abs(Math.sin(Date.now() / 150 + i * 0.9)) * 16;
        b.style.height = h + "px";
        b.style.opacity = "1";
      });
      vizFrame = requestAnimationFrame(tick);
    }
    tick();
  }

  // Floating bubbles removed from screen per user request; stubs kept for safety
  function addBubble(text, sender) {
    return null;
  }

  function addTypingBubble() {
    return null;
  }

  // ── Voice callbacks ────────────────────────────────────────
  VITHVoice.onSpeakStart = () => {
    // Temporarily pause mic while VITH speaks to prevent hearing own voice
    if (VITHVoice.isListening) {
      VITHVoice.stopListening();
    }
    setStatus("speaking");
    vithCore && vithCore.classList.add("speaking");
    if (stopBtn) {
      stopBtn.classList.remove("hidden");
      stopBtn.classList.add("speaking-active");
    }
    textInput.placeholder = "VITH is speaking... (Click ⏹ Stop or press Esc)";
    startViz(true);
  };

  VITHVoice.onSpeakEnd = () => {
    setStatus(null);
    vithCore && vithCore.classList.remove("speaking");
    if (stopBtn) {
      stopBtn.classList.add("hidden");
      stopBtn.classList.remove("speaking-active");
    }
    textInput.placeholder = "Ask Vith anything about Vinay...";
    startViz(false);
  };

  VITHVoice.onListenStart = () => {
    console.log("%c[VITH App: onListenStart]%c Mic activated in UI. Waveform starting.", "color: #00ff88; font-weight: bold", "color: inherit");
    setStatus("listening");
    micBtn.classList.add("mic-active");
    micBtn.title = "Click to stop mic";
    textInput.placeholder = "Listening... Speak your question";
    hideMicToast();
    startViz(true);
  };

  VITHVoice.onListenEnd = () => {
    console.log(`[VITH App: onListenEnd] Voice ended. wantsToListen: ${wantsToListen}`);
    if (wantsToListen) {
      console.log("[VITH App: onListenEnd] Auto-restarting recognition in 250ms...");
      setTimeout(() => {
        if (wantsToListen) VITHVoice.startListening();
      }, 250);
      return;
    }
    startViz(false);
    setStatus(null);
    micBtn.classList.remove("mic-active");
    micBtn.title = "Speak to Vith";
    textInput.placeholder = "Ask Vith anything about Vinay...";
  };

  // Words appearing in real-time inside text input
  VITHVoice.onListenResult = (transcript, isFinal) => {
    console.log(`%c[VITH App: onListenResult]%c "${transcript}" (final: ${isFinal})`, "color: #00d4ff; font-weight: bold", "color: inherit");
    textInput.value = transcript;
    textInput.style.color = isFinal ? "var(--text-primary)" : "var(--holo-gold)";
  };

  // Silence → auto submit
  VITHVoice.onListenSubmit = (fullText) => {
    console.log(`%c[VITH App: onListenSubmit]%c Submitting full query: "${fullText}"`, "color: #ffaa00; font-weight: bold", "color: inherit");
    if (!fullText || !fullText.trim()) return;
    wantsToListen = false;
    VITHVoice.stopListening();
    setStatus(null);
    startViz(false);
    micBtn.classList.remove("mic-active");
    micBtn.title = "Speak to Vith";
    textInput.style.color = "var(--text-primary)";
    textInput.value = "";
    textInput.placeholder = "Ask Vith anything about Vinay...";
    handleUserQuery(fullText.trim());
  };

  // ── Permission handling ────────────────────────────────────
  VITHVoice.onPermissionDenied = (reason) => {
    console.warn("[VITH App: onPermissionDenied] Mic permission blocked. Reason:", reason);
    wantsToListen = false;
    VITHVoice.isListening = false;
    micBtn.classList.remove("mic-active");
    setStatus(null);
    startViz(false);
    const msg = reason === "not-supported"
      ? `<strong>⚠ Not supported</strong><br>Use <strong>Chrome</strong> or <strong>Edge</strong> for voice input.`
      : `<strong>🎤 Mic blocked</strong><br>
         Click the 🔒 lock in the address bar<br>
         → set <em>Microphone</em> to <strong>Allow</strong><br>
         → refresh and try again`;
    showMicToast(msg);
  };

  VITHVoice.onPermissionGranted = () => {
    console.log("[VITH App: onPermissionGranted] Mic permission granted.");
    hideMicToast();
  };

  VITHVoice.onError = (error) => {
    console.warn("[VITH App: onError] STT error received:", error);
    wantsToListen = false;
    const message = error.error === "network"
      ? `<strong>⚠ Browser speech service unavailable</strong><br>Open this page in Chrome or Edge to use voice input.`
      : `<strong>⚠ Voice input failed</strong><br>Please try again or type your question.`;
    showMicToast(message);
  };

  // ── Mic toast above capsule ────────────────────────────────
  function showMicToast(html) {
    let toast = document.getElementById("mic-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "mic-toast";
      toast.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 4, 8, 0.97);
        border: 1px solid rgba(255, 80, 80, 0.5);
        border-radius: 12px;
        padding: 14px 18px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 0.85rem;
        color: #e0f8ff;
        line-height: 1.7;
        box-shadow: 0 0 24px rgba(255, 60, 60, 0.2);
        z-index: 600;
        max-width: 380px;
        width: calc(100vw - 40px);
        text-align: center;
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = html +
      `<br><button onclick="document.getElementById('mic-toast').remove()"
        style="margin-top:8px;background:none;border:1px solid rgba(0,212,255,0.3);
        border-radius:20px;padding:4px 14px;color:var(--holo-cyan);cursor:pointer;
        font-family:'Share Tech Mono',monospace;font-size:0.65rem;letter-spacing:1px">
        DISMISS</button>`;
  }

  function hideMicToast() {
    const t = document.getElementById("mic-toast");
    if (t) t.remove();
  }

  // ── Handle query (Intelligent Voice-Guided Navigation & Response) ──
  function handleUserQuery(text) {
    const queryText = (text || "").trim();
    if (!queryText) return;

    // Process query to retrieve spoken response and intelligent navigation metadata
    const intentResult = VITH_QA.processQuery ? VITH_QA.processQuery(queryText) : { text: VITH_QA.respond(queryText) };
    const response = intentResult.text;

    // Record both question & answer into conversation intel history
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    chatHistory.push({
      time: timeStr,
      query: queryText,
      answer: response
    });
    saveChatHistory();
    updateHistoryBadge();

    // If modal is currently open, refresh view
    if (isHistoryModalOpen()) {
      renderHistoryModal();
    }

    // Voice response: VITH speaks out loud without cluttering the screen with text bubbles
    VITHVoice.speak(response);

    // Section navigation and content highlighting
    if (intentResult && intentResult.shouldNavigate && intentResult.sectionId) {
      navigateAndHighlight(intentResult.sectionId, intentResult.targetItem, intentResult.shouldOpenModal);
    }
  }

  // ── Send button ────────────────────────────────────────────
  sendBtn.addEventListener("click", () => {
    const val = textInput.value.trim();
    if (!val) return;
    handleUserQuery(val);
    textInput.value = "";
    textInput.style.color = "var(--text-primary)";
  });

  textInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const val = textInput.value.trim();
      if (!val) return;
      handleUserQuery(val);
      textInput.value = "";
      textInput.style.color = "var(--text-primary)";
    }
  });

  // ── Mic button — fully async, clean toggle ─────────────────
  micBtn.addEventListener("click", async () => {
    console.log(`%c[VITH App: Mic Button Click]%c wantsToListen=${wantsToListen}, VITHVoice.isListening=${VITHVoice.isListening}`, "color: #00d4ff; font-weight: bold", "color: inherit");
    if (wantsToListen || VITHVoice.isListening) {
      // STOP listening
      console.log("[VITH App: Mic Button Click] User clicked to STOP mic.");
      wantsToListen = false;
      VITHVoice.stopListening();
      clearTimeout(VITHVoice.silenceTimer);
      setStatus(null);
      startViz(false);
      micBtn.classList.remove("mic-active");
      micBtn.title = "Speak to Vith";
      textInput.placeholder = "Ask Vith anything about Vinay...";
    } else {
      // START listening
      console.log("[VITH App: Mic Button Click] User clicked to START mic.");
      wantsToListen = true;
      textInput.value = "";
      textInput.placeholder = "Listening... Speak your question";
      await VITHVoice.startListening();
    }
  });
}
