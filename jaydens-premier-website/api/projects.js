/**
 * /api/projects
 *
 * GET     — public. Returns { projects }. Used by both the public site
 *           and the admin panel to list current projects.
 * POST    — protected. Body: { name, service, location, beforeImage, afterImage }
 * PUT     — protected. Body: { id, name?, service?, location?, beforeImage?, afterImage? }
 * DELETE  — protected. Body: { id }
 *
 * Stored as a single JSON array in Vercel KV under "site:projects".
 * Newest project first.
 */
const { kv } = require("@vercel/kv");
const { isAuthenticated } = require("../lib/auth");

const KEY = "site:projects";

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const projects = (await kv.get(KEY)) || [];
      res.status(200).json({ projects });
      return;
    }

    if (!isAuthenticated(req)) {
      res.status(401).json({ error: "Not signed in." });
      return;
    }

    const projects = (await kv.get(KEY)) || [];

    if (req.method === "POST") {
      const { name, service, location, beforeImage, afterImage } = req.body || {};
      if (!name || !beforeImage || !afterImage) {
        res.status(400).json({ error: "Name, before photo, and after photo are required." });
        return;
      }
      const project = {
        id: `project-${Date.now()}`,
        name,
        service: service || "",
        location: location || "",
        beforeImage,
        afterImage
      };
      projects.unshift(project);
      await kv.set(KEY, projects);
      res.status(200).json({ project });
      return;
    }

    if (req.method === "PUT") {
      const { id, name, service, location, beforeImage, afterImage } = req.body || {};
      if (!id) {
        res.status(400).json({ error: "id is required." });
        return;
      }
      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) {
        res.status(404).json({ error: "Project not found." });
        return;
      }
      projects[index] = {
        ...projects[index],
        name: name ?? projects[index].name,
        service: service ?? projects[index].service,
        location: location ?? projects[index].location,
        beforeImage: beforeImage ?? projects[index].beforeImage,
        afterImage: afterImage ?? projects[index].afterImage
      };
      await kv.set(KEY, projects);
      res.status(200).json({ project: projects[index] });
      return;
    }

    if (req.method === "DELETE") {
      const { id } = req.body || {};
      if (!id) {
        res.status(400).json({ error: "id is required." });
        return;
      }
      const next = projects.filter((p) => p.id !== id);
      await kv.set(KEY, next);
      res.status(200).json({ success: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
};
