/**
 * script.js
 * ---------------------------------------------------------------
 * All interactive behavior. Content comes from data.js / config.js —
 * this file should not need edits when content changes.
 * ---------------------------------------------------------------
 */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Business info injection ---------------- */
  function injectBusinessInfo() {
    $$("[data-phone-href]").forEach((el) => (el.href = SITE_CONFIG.company.phoneHref));
    $$("[data-phone-text]").forEach((el) => (el.textContent = SITE_CONFIG.company.phone));
    $$("[data-email-href]").forEach((el) => (el.href = SITE_CONFIG.company.emailHref));
    $$("[data-email-text]").forEach((el) => (el.textContent = SITE_CONFIG.company.email));
    $$("[data-city-state]").forEach(
      (el) => (el.textContent = `${SITE_CONFIG.company.city}, ${SITE_CONFIG.company.stateAbbr}`)
    );
    $$("[data-hours]").forEach((el) => (el.textContent = SITE_CONFIG.company.businessHours));
    $$("[data-brand-name]").forEach((el) => (el.textContent = SITE_CONFIG.company.shortName));
    $$("[data-legal-name]").forEach((el) => (el.textContent = SITE_CONFIG.company.legalName));
    $$("[data-brand-logo]").forEach((el) => (el.src = SITE_CONFIG.company.logo));
    const privacy = $("[data-privacy-link]");
    if (privacy) privacy.href = SITE_CONFIG.legal.privacyPolicyUrl;
    const terms = $("[data-terms-link]");
    if (terms) terms.href = SITE_CONFIG.legal.termsUrl;
    document.title = SITE_CONFIG.seo.title;
  }

  /* ---------------- Mobile menu ---------------- */
  function initMobileMenu() {
    const toggle = $(".nav-toggle");
    const menu = $(".mobile-menu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    $$("a", menu).forEach((link) =>
      link.addEventListener("click", () => {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      })
    );
  }

  /* ---------------- Trust bar ---------------- */
  function renderTrustBar() {
    const wrap = $("#trust-bar-items");
    if (!wrap) return;
    wrap.innerHTML = SITE_CONFIG.trustPoints
      .map(
        (t) => `
      <div class="trust-item">
        <i class="ti ${t.icon}" aria-hidden="true"></i>
        <span>${t.label}</span>
      </div>`
      )
      .join("");
  }

  /* ---------------- Services ---------------- */
  function renderServices() {
    const grid = $("#services-grid");
    if (!grid) return;
    grid.innerHTML = SERVICES.map((s) => {
      if (s.comingSoon) {
        // Coming-soon tiles are data-driven: flip `comingSoon` to false in
        // data.js and fill in a real description/photo once this service
        // is ready — no HTML/CSS/JS changes needed.
        return `
        <button type="button" class="service-tile service-tile-soon reveal" id="service-${s.id}">
          <span class="service-badge">Coming soon</span>
          <i class="ti ${s.icon}" aria-hidden="true"></i>
          <h3>${s.name}</h3>
          <p>${s.description}</p>
        </button>`;
      }
      return `
      <div class="service-tile reveal" id="service-${s.id}">
        <i class="ti ${s.icon}" aria-hidden="true"></i>
        ${s.tagline ? `<p class="service-tagline">${s.tagline}</p>` : ""}
        <h3>${s.name}</h3>
        <p>${s.description}</p>
      </div>`;
    }).join("");

    $$(".service-tile-soon", grid).forEach((btn) => {
      const service = SERVICES.find((s) => `service-${s.id}` === btn.id);
      if (!service) return;
      btn.addEventListener("click", () =>
        openInfoModal(service.name, service.comingSoonMessage)
      );
    });
  }

  /* ---------------- Reusable info modal ---------------- */
  function openInfoModal(title, message) {
    const modal = $("#info-modal");
    if (!modal) return;
    $("#info-modal-title").textContent = title;
    $("#info-modal-message").textContent = message;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeInfoModal() {
    const modal = $("#info-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  function initInfoModal() {
    const modal = $("#info-modal");
    if (!modal) return;
    $("#info-modal-close").addEventListener("click", closeInfoModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeInfoModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeInfoModal();
    });
  }

  /* ---------------- Why choose us ---------------- */
  function renderWhyChooseUs() {
    const grid = $("#why-grid");
    if (!grid) return;
    grid.innerHTML = WHY_CHOOSE_US.map(
      (w) => `
      <div class="why-item">
        <i class="ti ${w.icon}" aria-hidden="true"></i>
        <span>${w.label}</span>
      </div>`
    ).join("");
  }

  /* ---------------- About ---------------- */
  function renderAbout() {
    const el = $("#about-text");
    if (el) {
      const paragraphs = ABOUT_TEXT.split(/\n\s*\n/).filter((p) => p.trim().length);
      el.innerHTML = paragraphs.map((p) => `<p>${p.trim()}</p>`).join("");
    }
    const media = $("#about-media");
    if (media) {
      media.innerHTML = ABOUT_IMAGE
        ? `<img src="${ABOUT_IMAGE}" alt="Jayden's Premier Construction LLC team" loading="lazy" />`
        : `<span>Team / work photo placeholder</span>`;
    }
  }

  /* ---------------- Areas served ---------------- */
  function renderAreas() {
    const list = $("#areas-list");
    if (!list) return;
    list.innerHTML = SERVICE_AREAS.map((a) => `<li>${a}</li>`).join("");
  }

  /* ---------------- Before / After content (image or placeholder) ---------------- */
  function renderBeforeAfter() {
    const afterSlot = $("#ba-after-slot");
    const beforeSlot = $("#ba-before-slot");
    if (!afterSlot || !beforeSlot) return;
    afterSlot.innerHTML = BEFORE_AFTER.afterImage
      ? `<img src="${BEFORE_AFTER.afterImage}" alt="${BEFORE_AFTER.afterAlt || "After"}" />`
      : `<div class="ba-placeholder after">${BEFORE_AFTER.afterAlt || "[ADD AFTER IMAGE]"}</div>`;
    beforeSlot.innerHTML = BEFORE_AFTER.beforeImage
      ? `<img src="${BEFORE_AFTER.beforeImage}" alt="${BEFORE_AFTER.beforeAlt || "Before"}" />`
      : `<div class="ba-placeholder before">${BEFORE_AFTER.beforeAlt || "[ADD BEFORE IMAGE]"}</div>`;
  }

  /* ---------------- Testimonials ---------------- */
  // Each entry with a real `text` renders as a normal review. Entries still
  // using the placeholder text render as an honest "coming soon" card
  // instead of fake content. Once the admin panel is built, adding a real
  // review there just replaces one of these entries — no other code changes.
  function renderTestimonials() {
    const grid = $("#testimonials-grid");
    if (!grid) return;
    grid.innerHTML = TESTIMONIALS.map((t) => {
      const isPlaceholder = !t.text || t.text.startsWith("[ADD");
      if (isPlaceholder) {
        return `
        <div class="testimonial-card testimonial-card-soon">
          <i class="ti ti-quote" aria-hidden="true"></i>
          <p class="testimonial-soon-label">Client reviews coming soon</p>
        </div>`;
      }
      return `
      <div class="testimonial-card">
        <i class="ti ti-quote" aria-hidden="true"></i>
        <p class="quote">${t.text}</p>
        <p class="testimonial-meta">${t.name}${t.location ? " &middot; " + t.location : ""}
          ${t.service ? `<span>${t.service}</span>` : ""}
        </p>
      </div>`;
    }).join("");
  }

  /* ---------------- Projects + Lightbox ---------------- */
  let lightboxIndex = 0;
  const PROJECTS_PAGE_SIZE = 6;
  let projectsVisibleCount = PROJECTS_PAGE_SIZE;

  function renderProjects() {
    const grid = $("#projects-grid");
    if (!grid) return;
    const visible = PROJECTS.slice(0, projectsVisibleCount);
    grid.innerHTML = visible.map(
      (p, i) => `
      <button class="project-card reveal" type="button" data-index="${i}" aria-label="View before and after photos: ${p.name}">
        <div class="project-media-pair">
          <div class="project-media-half">
            ${p.beforeImage ? `<img src="${p.beforeImage}" alt="${p.name} — before" loading="lazy" />` : ""}
            <span class="project-media-tag">Before</span>
          </div>
          <div class="project-media-half">
            ${p.afterImage ? `<img src="${p.afterImage}" alt="${p.name} — after" loading="lazy" />` : ""}
            <span class="project-media-tag project-media-tag-after">After</span>
          </div>
        </div>
        <div class="project-body">
          <h3>${p.name}</h3>
          <p class="project-meta">${p.service} &middot; ${p.location}</p>
        </div>
      </button>`
    ).join("");

    $$(".project-card", grid).forEach((card) =>
      card.addEventListener("click", () => openLightbox(Number(card.dataset.index)))
    );

    revealElements($$(".reveal", grid));
    renderProjectsMoreButton();
  }

  function renderProjectsMoreButton() {
    const wrap = $("#projects-more-wrap");
    if (!wrap) return;
    const remaining = PROJECTS.length - projectsVisibleCount;
    if (remaining <= 0) {
      wrap.innerHTML = "";
      return;
    }
    wrap.innerHTML = `
      <button type="button" class="btn btn-outline-dark" id="projects-more-btn">
        See more projects (${remaining} more)
      </button>`;
    $("#projects-more-btn").addEventListener("click", () => {
      projectsVisibleCount += PROJECTS_PAGE_SIZE;
      renderProjects();
    });
  }

  function getFlatLightboxPhotos() {
    const withPhotos = PROJECTS.filter((p) => p.beforeImage && p.afterImage);
    const flat = [];
    withPhotos.forEach((p) => {
      flat.push({ project: p, image: p.beforeImage, label: "Before" });
      flat.push({ project: p, image: p.afterImage, label: "After" });
    });
    return flat;
  }

  function openLightbox(index) {
    const flat = getFlatLightboxPhotos();
    if (!flat.length) return; // nothing real to show yet
    const clickedProject = PROJECTS[index];
    const foundAt = flat.findIndex((f) => f.project === clickedProject);
    lightboxIndex = foundAt >= 0 ? foundAt : 0;
    updateLightbox(flat);
    $("#lightbox").classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function updateLightbox(flat) {
    const item = flat[lightboxIndex];
    const img = $("#lightbox-img");
    img.src = item.image;
    img.alt = `${item.project.name} — ${item.label.toLowerCase()}`;
    const tag = $("#lightbox-tag");
    tag.textContent = item.label;
    tag.className = "lightbox-tag" + (item.label === "After" ? " after" : "");
    $("#lightbox-caption").textContent = `${item.project.name} — ${item.project.service}, ${item.project.location}`;
  }

  function initLightbox() {
    const box = $("#lightbox");
    if (!box) return;
    $("#lightbox-close").addEventListener("click", closeLightbox);
    box.addEventListener("click", (e) => {
      if (e.target === box) closeLightbox();
    });
    $("#lightbox-prev").addEventListener("click", () => {
      const flat = getFlatLightboxPhotos();
      if (!flat.length) return;
      lightboxIndex = (lightboxIndex - 1 + flat.length) % flat.length;
      updateLightbox(flat);
    });
    $("#lightbox-next").addEventListener("click", () => {
      const flat = getFlatLightboxPhotos();
      if (!flat.length) return;
      lightboxIndex = (lightboxIndex + 1) % flat.length;
      updateLightbox(flat);
    });
    document.addEventListener("keydown", (e) => {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") $("#lightbox-prev").click();
      if (e.key === "ArrowRight") $("#lightbox-next").click();
    });

    // Swipe support — behaves like a phone photo gallery: swipe left/right
    // to move between Before/After and on into the next/previous project.
    let touchStartX = null;
    box.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    box.addEventListener(
      "touchend",
      (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const SWIPE_THRESHOLD = 40;
        if (dx > SWIPE_THRESHOLD) $("#lightbox-prev").click();
        else if (dx < -SWIPE_THRESHOLD) $("#lightbox-next").click();
        touchStartX = null;
      },
      { passive: true }
    );
  }

  function closeLightbox() {
    $("#lightbox").classList.remove("is-open");
    document.body.style.overflow = "";
  }

  /* ---------------- Before / After slider ---------------- */
  function initBeforeAfter() {
    const wrap = $(".ba-wrap");
    if (!wrap) return;
    const beforeWrap = $(".ba-before-wrap", wrap);
    const divider = $(".ba-divider", wrap);
    const handle = $(".ba-handle", wrap);
    const range = $(".ba-slider", wrap);

    function setPosition(percent) {
      const clamped = Math.min(96, Math.max(4, percent));
      beforeWrap.style.width = clamped + "%";
      divider.style.left = clamped + "%";
      handle.style.left = clamped + "%";
      range.value = clamped;
      range.setAttribute("aria-valuenow", Math.round(clamped));
    }

    range.addEventListener("input", (e) => setPosition(Number(e.target.value)));
    setPosition(50);
  }

  /* ---------------- Hero video fallback logic ---------------- */
  function initHeroVideo() {
    const video = $("#hero-video");
    const fallback = $("#hero-fallback-img");
    if (!video) return;

    video.src = SITE_CONFIG.hero.videoMp4;
    video.poster = SITE_CONFIG.hero.poster;
    fallback.src = SITE_CONFIG.hero.fallbackImage;

    function showFallback() {
      video.style.display = "none";
      fallback.style.display = "block";
    }

    if (prefersReducedMotion) {
      showFallback();
      return;
    }

    const canPlay = video.canPlayType && video.canPlayType('video/mp4; codecs="avc1.42E01E"');
    if (!canPlay) {
      showFallback();
      return;
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(showFallback);
    }
    video.addEventListener("error", showFallback);
  }

  /* ---------------- Contact map (free Google Maps Embed, no API key) ---------------- */
  function initContactMap() {
    const frame = $("#contact-map");
    if (!frame) return;
    const zip = (SITE_CONFIG.mapZip || "").trim();
    if (!zip) return;
    const query = encodeURIComponent(`${zip}, ${SITE_CONFIG.company.state}`);
    frame.src = `https://www.google.com/maps?q=${query}&output=embed`;
  }

  /* ---------------- Smooth scroll for in-page anchors ---------------- */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      });
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  // Shared observer so elements added later (e.g. "See more" projects) can
  // be revealed too, not just the ones present at page load.
  let revealObserver = null;
  function revealElements(elements) {
    if (!elements.length) return;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
    }
    elements.forEach((el) => revealObserver.observe(el));
  }

  function initScrollReveal() {
    const targets = $$(".reveal, .section-head");
    targets.forEach((t) => t.classList.add("reveal"));
    revealElements(targets);
  }

  /* ---------------- Estimate form ---------------- */
  const MAX_FILES = 6;
  const MAX_FILE_MB = 8;
  const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  let selectedFiles = [];

  function initEstimateForm() {
    const form = $("#estimate-form");
    if (!form) return;

    // Without this, dropping an image anywhere on the page slightly
    // outside the drop zone below makes the browser open it full-page
    // instead of ignoring it.
    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("drop", (e) => e.preventDefault());

    const fileInput = $("#photos", form);
    const fileDrop = $("#file-drop", form);
    const fileList = $("#file-list", form);
    const status = $("#form-status", form);

    fileDrop.addEventListener("click", () => fileInput.click());
    fileDrop.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInput.click();
      }
    });
    ["dragover", "dragenter"].forEach((evt) =>
      fileDrop.addEventListener(evt, (e) => {
        e.preventDefault();
        fileDrop.classList.add("is-dragover");
      })
    );
    ["dragleave", "drop"].forEach((evt) =>
      fileDrop.addEventListener(evt, (e) => {
        e.preventDefault();
        fileDrop.classList.remove("is-dragover");
      })
    );
    fileDrop.addEventListener("drop", (e) => handleFiles(e.dataTransfer.files));
    fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

    function handleFiles(fileListInput) {
      const incoming = Array.from(fileListInput);
      for (const file of incoming) {
        if (selectedFiles.length >= MAX_FILES) {
          showFieldError("photos-error", `You can upload up to ${MAX_FILES} photos.`);
          break;
        }
        if (!ACCEPTED_TYPES.includes(file.type)) {
          showFieldError("photos-error", "Only JPG, PNG, and WebP files are accepted.");
          continue;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
          showFieldError("photos-error", `Each photo must be under ${MAX_FILE_MB}MB.`);
          continue;
        }
        clearFieldError("photos-error");
        selectedFiles.push(file);
      }
      renderFileList();
    }

    function renderFileList() {
      fileList.innerHTML = selectedFiles
        .map(
          (f, i) => `
        <span class="file-chip">${f.name} <button type="button" data-remove="${i}" aria-label="Remove ${f.name}"><i class="ti ti-x" aria-hidden="true"></i></button></span>`
        )
        .join("");
      $$("[data-remove]", fileList).forEach((btn) =>
        btn.addEventListener("click", () => {
          selectedFiles.splice(Number(btn.dataset.remove), 1);
          renderFileList();
        })
      );
    }

    function showFieldError(id, message) {
      const err = $("#" + id);
      if (!err) return;
      err.textContent = message;
      err.closest(".field").classList.add("has-error");
    }
    function clearFieldError(id) {
      const err = $("#" + id);
      if (!err) return;
      err.textContent = "";
      err.closest(".field").classList.remove("has-error");
    }

    function isValidEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }
    function isValidPhone(v) {
      return /^[0-9()+\-.\s]{7,20}$/.test(v);
    }

    function setStatus(kind, message) {
      status.className = "form-status is-visible " + kind;
      status.textContent = message;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let valid = true;
      const required = [
        ["name", "name-error", "Enter your full name."],
        ["phone", "phone-error", "Enter a valid phone number."],
        ["email", "email-error", "Enter a valid email address."],
        ["service", "service-error", "Select a service."],
        ["address", "address-error", "Enter the project address."]
      ];

      for (const [fieldName, errorId, message] of required) {
        const field = form.elements[fieldName];
        const value = field.value.trim();
        let fieldValid = value.length > 0;
        if (fieldName === "email") fieldValid = fieldValid && isValidEmail(value);
        if (fieldName === "phone") fieldValid = fieldValid && isValidPhone(value);
        if (fieldValid) {
          clearFieldError(errorId);
        } else {
          showFieldError(errorId, message);
          valid = false;
        }
      }

      if (!valid) {
        setStatus("error", "Please fix the highlighted fields and try again.");
        return;
      }

      const ej = SITE_CONFIG.emailjs || {};
      const ejMissing =
        !ej.serviceId || !ej.templateId || !ej.publicKey ||
        String(ej.serviceId).startsWith("[ADD") ||
        String(ej.templateId).startsWith("[ADD") ||
        String(ej.publicKey).startsWith("[ADD");
      if (ejMissing) {
        setStatus(
          "notice",
          "This form is not yet connected to an email service. Add your EmailJS serviceId/templateId/publicKey in config.js to start receiving leads."
        );
        return;
      }

      form.classList.add("is-loading");
      setStatus("notice", "");
      status.classList.remove("is-visible");

      try {
        const templateParams = {
          name: form.elements["name"].value.trim(),
          phone: form.elements["phone"].value.trim(),
          email: form.elements["email"].value.trim(),
          service: form.elements["service"].value.trim(),
          address: form.elements["address"].value.trim(),
          details: form.elements["details"].value.trim() || "(none provided)"
        };

        // Note: EmailJS's free plan does not support sending photo
        // attachments by email. Selected photo file names are included
        // in the message below so nothing is silently lost, but the
        // actual image files are not attached to the email itself.
        if (selectedFiles.length) {
          templateParams.details +=
            "\n\nPhotos attached on form (not emailed): " +
            selectedFiles.map((f) => f.name).join(", ");
        }

        await emailjs.send(ej.serviceId, ej.templateId, templateParams, ej.publicKey);

        setStatus("success", "Thanks — your request was sent. We'll be in touch shortly.");
        form.reset();
        selectedFiles = [];
        renderFileList();
      } catch (err) {
        setStatus("error", "Something went wrong sending your request. Please call or email us directly.");
      } finally {
        form.classList.remove("is-loading");
      }
    });
  }

  /* ---------------- Init ---------------- */
  /* ---------------- Live data from the admin panel (with fallback) ----------------
   * If /api/projects or /api/testimonials aren't reachable — the admin panel
   * hasn't been deployed yet, or this file is being opened directly on disk —
   * this quietly keeps whatever is in data.js (the placeholders/coming-soon
   * states already built). Once the panel is live and has real entries,
   * those replace the local arrays automatically, no code changes needed.
   */
  async function loadProjectsFromApi() {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("not available");
      const data = await res.json();
      if (Array.isArray(data.projects) && data.projects.length) {
        PROJECTS.length = 0;
        data.projects.forEach((p) => PROJECTS.push(p));
      }
    } catch {
      // API not available yet — keep the local data.js content.
    }
    renderProjects();
  }

  async function loadTestimonialsFromApi() {
    try {
      const res = await fetch("/api/testimonials");
      if (!res.ok) throw new Error("not available");
      const data = await res.json();
      if (Array.isArray(data.testimonials) && data.testimonials.length) {
        TESTIMONIALS.length = 0;
        data.testimonials.forEach((t) => TESTIMONIALS.push(t));
      }
    } catch {
      // API not available yet — keep the local data.js content.
    }
    renderTestimonials();
  }

  // Reads the "Before & after" photo pair from the admin panel once that
  // endpoint exists. Until then (or if it's unreachable), this quietly
  // keeps the placeholder/real values already set in data.js.
  async function loadBeforeAfterFromApi() {
    try {
      const res = await fetch("/api/before-after");
      if (!res.ok) throw new Error("not available");
      const data = await res.json();
      if (data && (data.beforeImage || data.afterImage)) {
        Object.assign(BEFORE_AFTER, data);
      }
    } catch {
      // API not available yet — keep the local data.js content.
    }
    renderBeforeAfter();
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectBusinessInfo();
    initMobileMenu();
    renderTrustBar();
    renderServices();
    renderWhyChooseUs();
    renderAbout();
    renderAreas();
    loadTestimonialsFromApi();
    loadProjectsFromApi();
    loadBeforeAfterFromApi();
    initLightbox();
    initInfoModal();
    initBeforeAfter();
    initHeroVideo();
    initContactMap();
    initSmoothScroll();
    initEstimateForm();
    initScrollReveal();
  });
})();
