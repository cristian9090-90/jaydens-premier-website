/**
 * admin/admin.js
 * ---------------------------------------------------------------
 * All the admin panel's client-side behavior. Talks only to the
 * /api/* routes — never touches Vercel KV/Blob directly (that only
 * happens server-side, where the credentials live).
 * ---------------------------------------------------------------
 */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  // Escapes text before it's inserted with innerHTML, so a project name,
  // review, etc. can never be interpreted as HTML/script in your own panel.
  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  let editingProjectId = null;
  let editingTestimonialId = null;

  // Must match the county names used in coverage-map.js exactly
  // (no "County" suffix) — this is what gets saved to /api/coverage.
  const NJ_COUNTIES = [
    "Atlantic", "Bergen", "Burlington", "Camden", "Cape May", "Cumberland",
    "Essex", "Gloucester", "Hudson", "Hunterdon", "Mercer", "Middlesex",
    "Monmouth", "Morris", "Ocean", "Passaic", "Salem", "Somerset",
    "Sussex", "Union", "Warren"
  ];

  /* ---------------- API helper ---------------- */
  async function api(path, options) {
    const res = await fetch(path, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...options
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (!res.ok) {
      throw new Error((body && body.error) || `Request failed (${res.status}).`);
    }
    return body;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result; // "data:image/jpeg;base64,AAAA..."
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadImage(file) {
    const dataBase64 = await fileToBase64(file);
    const result = await api("/api/upload", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, dataBase64, contentType: file.type })
    });
    return result.url;
  }

  /* ---------------- Session / view switching ---------------- */
  async function checkSession() {
    let authenticated = false;
    try {
      const result = await api("/api/me");
      authenticated = !!result.authenticated;
    } catch {
      authenticated = false;
    }
    $("#admin-login-screen").hidden = authenticated;
    $("#admin-dashboard").hidden = !authenticated;
    if (authenticated) {
      loadProjects();
      loadTestimonials();
      loadCoverage();
      loadBeforeAfter();
    }
  }

  function initLogin() {
    const form = $("#login-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = $("#login-error");
      errorEl.textContent = "";
      const email = $("#login-email").value.trim();
      const password = $("#login-password").value;
      const submitBtn = $("#login-submit");
      submitBtn.disabled = true;
      try {
        await api("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });
        form.reset();
        await checkSession();
      } catch (err) {
        errorEl.textContent = err.message || "Sign-in failed.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  function initLogout() {
    $("#logout-btn").addEventListener("click", async () => {
      try {
        await api("/api/logout", { method: "POST" });
      } catch {
        // ignore — we're logging out regardless
      }
      checkSession();
    });
  }

  /* ---------------- Tabs ---------------- */
  function initTabs() {
    const panelIds = {
      projects: "#tab-projects",
      testimonials: "#tab-testimonials",
      coverage: "#tab-coverage",
      beforeafter: "#tab-beforeafter"
    };
    $$(".admin-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        $$(".admin-tab").forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        const target = tab.dataset.tab;
        Object.keys(panelIds).forEach((key) => {
          const el = $(panelIds[key]);
          if (el) el.hidden = key !== target;
        });
      });
    });
  }

  /* ---------------- Projects ---------------- */
  async function loadProjects() {
    try {
      const { projects } = await api("/api/projects");
      renderProjectsList(projects || []);
    } catch (err) {
      $("#projects-list").innerHTML = "";
      $("#projects-empty").hidden = false;
      $("#projects-empty").textContent = "Couldn't load projects: " + err.message;
    }
  }

  function renderProjectsList(projects) {
    const list = $("#projects-list");
    const empty = $("#projects-empty");
    if (!projects.length) {
      list.innerHTML = "";
      empty.hidden = false;
      empty.textContent = "No projects yet. Add your first one above.";
      return;
    }
    empty.hidden = true;
    list.innerHTML = projects
      .map(
        (p) => `
      <div class="admin-item" data-id="${p.id}">
        <div class="admin-item-thumbs">
          <img src="${escapeHtml(p.beforeImage)}" alt="Before" />
          <img src="${escapeHtml(p.afterImage)}" alt="After" />
        </div>
        <div class="admin-item-body">
          <p class="admin-item-title">${escapeHtml(p.name)}</p>
          <p class="admin-item-meta">${escapeHtml(p.service || "")}${p.service && p.location ? " · " : ""}${escapeHtml(p.location || "")}</p>
        </div>
        <div class="admin-item-actions">
          <button type="button" class="admin-icon-btn" data-edit-project="${p.id}"><i class="ti ti-edit" aria-hidden="true"></i></button>
          <button type="button" class="admin-icon-btn admin-icon-btn-danger" data-delete-project="${p.id}"><i class="ti ti-trash" aria-hidden="true"></i></button>
        </div>
      </div>`
      )
      .join("");

    $$("[data-edit-project]", list).forEach((btn) =>
      btn.addEventListener("click", () => editProject(btn.dataset.editProject, projects))
    );
    $$("[data-delete-project]", list).forEach((btn) =>
      btn.addEventListener("click", () => deleteProject(btn.dataset.deleteProject))
    );
  }

  function showProjectForm() {
    $("#project-form").hidden = false;
    $("#show-add-project").hidden = true;
  }
  function hideProjectForm() {
    $("#project-form").hidden = true;
    $("#show-add-project").hidden = false;
    $("#project-form").reset();
    $("#project-form-error").textContent = "";
    editingProjectId = null;
    $("#project-form-submit").textContent = "Save project";
  }

  function editProject(id, projects) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    editingProjectId = id;
    $("#project-name").value = project.name || "";
    $("#project-service").value = project.service || "";
    $("#project-location").value = project.location || "";
    $("#project-form-submit").textContent = "Update project";
    showProjectForm();
  }

  async function deleteProject(id) {
    if (!confirm("Delete this project? This can't be undone.")) return;
    try {
      await api("/api/projects", { method: "DELETE", body: JSON.stringify({ id }) });
      loadProjects();
    } catch (err) {
      alert("Couldn't delete: " + err.message);
    }
  }

  function initProjectForm() {
    $("#show-add-project").addEventListener("click", showProjectForm);
    $("#cancel-project-form").addEventListener("click", hideProjectForm);

    $("#project-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = $("#project-form-error");
      errorEl.textContent = "";
      const submitBtn = $("#project-form-submit");
      submitBtn.disabled = true;

      try {
        const name = $("#project-name").value.trim();
        const service = $("#project-service").value.trim();
        const location = $("#project-location").value.trim();
        const beforeFile = $("#project-before").files[0];
        const afterFile = $("#project-after").files[0];

        if (!editingProjectId && (!beforeFile || !afterFile)) {
          throw new Error("Both before and after photos are required for a new project.");
        }

        const payload = { name, service, location };
        if (beforeFile) payload.beforeImage = await uploadImage(beforeFile);
        if (afterFile) payload.afterImage = await uploadImage(afterFile);

        if (editingProjectId) {
          payload.id = editingProjectId;
          await api("/api/projects", { method: "PUT", body: JSON.stringify(payload) });
        } else {
          await api("/api/projects", { method: "POST", body: JSON.stringify(payload) });
        }

        hideProjectForm();
        loadProjects();
      } catch (err) {
        errorEl.textContent = err.message || "Couldn't save the project.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------------- Testimonials ---------------- */
  async function loadTestimonials() {
    try {
      const { testimonials } = await api("/api/testimonials");
      renderTestimonialsList(testimonials || []);
    } catch (err) {
      $("#testimonials-list").innerHTML = "";
      $("#testimonials-empty").hidden = false;
      $("#testimonials-empty").textContent = "Couldn't load reviews: " + err.message;
    }
  }

  function renderTestimonialsList(testimonials) {
    const list = $("#testimonials-list");
    const empty = $("#testimonials-empty");
    if (!testimonials.length) {
      list.innerHTML = "";
      empty.hidden = false;
      empty.textContent = "No reviews yet. Add your first one above.";
      return;
    }
    empty.hidden = true;
    list.innerHTML = testimonials
      .map(
        (t) => `
      <div class="admin-item" data-id="${t.id}">
        <div class="admin-item-body">
          <p class="admin-item-title">${escapeHtml(t.name)}</p>
          <p class="admin-item-meta">${escapeHtml(t.service || "")}${t.service && t.location ? " · " : ""}${escapeHtml(t.location || "")}</p>
          <p class="admin-item-text">${escapeHtml(t.text)}</p>
        </div>
        <div class="admin-item-actions">
          <button type="button" class="admin-icon-btn" data-edit-testimonial="${t.id}"><i class="ti ti-edit" aria-hidden="true"></i></button>
          <button type="button" class="admin-icon-btn admin-icon-btn-danger" data-delete-testimonial="${t.id}"><i class="ti ti-trash" aria-hidden="true"></i></button>
        </div>
      </div>`
      )
      .join("");

    $$("[data-edit-testimonial]", list).forEach((btn) =>
      btn.addEventListener("click", () => editTestimonial(btn.dataset.editTestimonial, testimonials))
    );
    $$("[data-delete-testimonial]", list).forEach((btn) =>
      btn.addEventListener("click", () => deleteTestimonial(btn.dataset.deleteTestimonial))
    );
  }

  function showTestimonialForm() {
    $("#testimonial-form").hidden = false;
    $("#show-add-testimonial").hidden = true;
  }
  function hideTestimonialForm() {
    $("#testimonial-form").hidden = true;
    $("#show-add-testimonial").hidden = false;
    $("#testimonial-form").reset();
    $("#testimonial-form-error").textContent = "";
    editingTestimonialId = null;
    $("#testimonial-form-submit").textContent = "Save review";
  }

  function editTestimonial(id, testimonials) {
    const t = testimonials.find((item) => item.id === id);
    if (!t) return;
    editingTestimonialId = id;
    $("#testimonial-name").value = t.name || "";
    $("#testimonial-service").value = t.service || "";
    $("#testimonial-location").value = t.location || "";
    $("#testimonial-text").value = t.text || "";
    $("#testimonial-form-submit").textContent = "Update review";
    showTestimonialForm();
  }

  async function deleteTestimonial(id) {
    if (!confirm("Delete this review? This can't be undone.")) return;
    try {
      await api("/api/testimonials", { method: "DELETE", body: JSON.stringify({ id }) });
      loadTestimonials();
    } catch (err) {
      alert("Couldn't delete: " + err.message);
    }
  }

  function initTestimonialForm() {
    $("#show-add-testimonial").addEventListener("click", showTestimonialForm);
    $("#cancel-testimonial-form").addEventListener("click", hideTestimonialForm);

    $("#testimonial-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = $("#testimonial-form-error");
      errorEl.textContent = "";
      const submitBtn = $("#testimonial-form-submit");
      submitBtn.disabled = true;

      try {
        const payload = {
          name: $("#testimonial-name").value.trim(),
          service: $("#testimonial-service").value.trim(),
          location: $("#testimonial-location").value.trim(),
          text: $("#testimonial-text").value.trim()
        };

        if (editingTestimonialId) {
          payload.id = editingTestimonialId;
          await api("/api/testimonials", { method: "PUT", body: JSON.stringify(payload) });
        } else {
          await api("/api/testimonials", { method: "POST", body: JSON.stringify(payload) });
        }

        hideTestimonialForm();
        loadTestimonials();
      } catch (err) {
        errorEl.textContent = err.message || "Couldn't save the review.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------------- Coverage (counties + ZIP) ---------------- */
  function renderCoverageCheckboxes(selectedCounties) {
    const grid = $("#coverage-counties-grid");
    const selected = new Set(selectedCounties || []);
    grid.innerHTML = NJ_COUNTIES.map((county, i) => {
      const id = `coverage-county-${i}`;
      const checked = selected.has(county) ? "checked" : "";
      return `
      <label class="admin-checkbox-item" for="${id}">
        <input type="checkbox" id="${id}" value="${county}" ${checked} />
        ${county}
      </label>`;
    }).join("");
  }

  async function loadCoverage() {
    try {
      const coverage = await api("/api/coverage");
      $("#coverage-zip").value = coverage.zip || "";
      renderCoverageCheckboxes(coverage.counties || []);
    } catch (err) {
      renderCoverageCheckboxes([]);
      $("#coverage-form-error").textContent = "Couldn't load current coverage: " + err.message;
    }
  }

  function initCoverageForm() {
    $("#coverage-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = $("#coverage-form-error");
      const successEl = $("#coverage-form-success");
      errorEl.textContent = "";
      successEl.textContent = "";
      const submitBtn = $("#coverage-form-submit");
      submitBtn.disabled = true;

      try {
        const zip = $("#coverage-zip").value.trim();
        if (!/^\d{5}$/.test(zip)) {
          throw new Error("ZIP code must be exactly 5 digits.");
        }
        const counties = $$("#coverage-counties-grid input[type=checkbox]:checked").map((cb) => cb.value);
        await api("/api/coverage", { method: "PUT", body: JSON.stringify({ counties, zip }) });
        successEl.textContent = "Coverage updated — the public map will reflect this now.";
      } catch (err) {
        errorEl.textContent = err.message || "Couldn't save coverage.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------------- Before / After (placeholder photo) ---------------- */
  function renderBeforeAfterPreview(data) {
    const preview = $("#beforeafter-preview");
    const thumbs = [];
    if (data.beforeImage) thumbs.push(`<img src="${escapeHtml(data.beforeImage)}" alt="Current before" />`);
    if (data.afterImage) thumbs.push(`<img src="${escapeHtml(data.afterImage)}" alt="Current after" />`);
    preview.innerHTML = thumbs.join("") || `<p class="admin-hint">No photos set yet — the public site shows its placeholder.</p>`;
  }

  async function loadBeforeAfter() {
    try {
      const data = await api("/api/before-after");
      renderBeforeAfterPreview(data);
    } catch (err) {
      $("#beforeafter-form-error").textContent = "Couldn't load current photos: " + err.message;
    }
  }

  function initBeforeAfterForm() {
    $("#beforeafter-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = $("#beforeafter-form-error");
      const successEl = $("#beforeafter-form-success");
      errorEl.textContent = "";
      successEl.textContent = "";
      const submitBtn = $("#beforeafter-form-submit");
      submitBtn.disabled = true;

      try {
        const beforeFile = $("#beforeafter-before").files[0];
        const afterFile = $("#beforeafter-after").files[0];
        if (!beforeFile && !afterFile) {
          throw new Error("Choose at least one photo to update.");
        }
        const payload = {};
        if (beforeFile) payload.beforeImage = await uploadImage(beforeFile);
        if (afterFile) payload.afterImage = await uploadImage(afterFile);

        const updated = await api("/api/before-after", { method: "PUT", body: JSON.stringify(payload) });
        renderBeforeAfterPreview(updated);
        $("#beforeafter-form").reset();
        successEl.textContent = "Photos updated — the public site will reflect this now.";
      } catch (err) {
        errorEl.textContent = err.message || "Couldn't save the photos.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------------- Change password ---------------- */
  function initPasswordModal() {
    const modal = $("#password-modal");
    $("#open-password-modal").addEventListener("click", () => {
      $("#password-form-error").textContent = "";
      $("#password-form-success").textContent = "";
      $("#password-form").reset();
      modal.classList.add("is-open");
    });
    $("#password-modal-close").addEventListener("click", () => modal.classList.remove("is-open"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("is-open");
    });

    $("#password-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = $("#password-form-error");
      const successEl = $("#password-form-success");
      errorEl.textContent = "";
      successEl.textContent = "";
      try {
        await api("/api/change-password", {
          method: "POST",
          body: JSON.stringify({
            currentPassword: $("#current-password").value,
            newPassword: $("#new-password").value
          })
        });
        successEl.textContent = "Password updated.";
        $("#password-form").reset();
      } catch (err) {
        errorEl.textContent = err.message || "Couldn't update the password.";
      }
    });
  }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initLogin();
    initLogout();
    initTabs();
    initProjectForm();
    initTestimonialForm();
    initCoverageForm();
    initBeforeAfterForm();
    initPasswordModal();
    checkSession();
  });
})();
