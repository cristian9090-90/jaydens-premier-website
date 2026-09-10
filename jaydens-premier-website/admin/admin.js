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

  let editingProjectId = null;
  let editingTestimonialId = null;

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
    $$(".admin-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        $$(".admin-tab").forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        const target = tab.dataset.tab;
        $("#tab-projects").hidden = target !== "projects";
        $("#tab-testimonials").hidden = target !== "testimonials";
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
          <img src="${p.beforeImage}" alt="Before" />
          <img src="${p.afterImage}" alt="After" />
        </div>
        <div class="admin-item-body">
          <p class="admin-item-title">${p.name}</p>
          <p class="admin-item-meta">${p.service || ""}${p.service && p.location ? " · " : ""}${p.location || ""}</p>
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
          <p class="admin-item-title">${t.name}</p>
          <p class="admin-item-meta">${t.service || ""}${t.service && t.location ? " · " : ""}${t.location || ""}</p>
          <p class="admin-item-text">${t.text}</p>
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
    initPasswordModal();
    checkSession();
  });
})();
