/**
 * /api/testimonials
 *
 * GET     — public. Returns { testimonials }.
 * POST    — protected. Body: { name, location, service, text, rating }
 * PUT     — protected. Body: { id, name?, location?, service?, text?, rating? }
 * DELETE  — protected. Body: { id }
 *
 * Stored as a single JSON array in Vercel KV under "site:testimonials".
 */
const { kv } = require("@vercel/kv");
const { isAuthenticated } = require("../lib/auth");

const KEY = "site:testimonials";

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const testimonials = (await kv.get(KEY)) || [];
      res.status(200).json({ testimonials });
      return;
    }

    if (!isAuthenticated(req)) {
      res.status(401).json({ error: "Not signed in." });
      return;
    }

    const testimonials = (await kv.get(KEY)) || [];

    if (req.method === "POST") {
      const { name, location, service, text, rating } = req.body || {};
      if (!name || !text) {
        res.status(400).json({ error: "Name and review text are required." });
        return;
      }
      const testimonial = {
        id: `testimonial-${Date.now()}`,
        name,
        location: location || "",
        service: service || "",
        text,
        rating: rating || null
      };
      testimonials.unshift(testimonial);
      await kv.set(KEY, testimonials);
      res.status(200).json({ testimonial });
      return;
    }

    if (req.method === "PUT") {
      const { id, name, location, service, text, rating } = req.body || {};
      if (!id) {
        res.status(400).json({ error: "id is required." });
        return;
      }
      const index = testimonials.findIndex((t) => t.id === id);
      if (index === -1) {
        res.status(404).json({ error: "Review not found." });
        return;
      }
      testimonials[index] = {
        ...testimonials[index],
        name: name ?? testimonials[index].name,
        location: location ?? testimonials[index].location,
        service: service ?? testimonials[index].service,
        text: text ?? testimonials[index].text,
        rating: rating ?? testimonials[index].rating
      };
      await kv.set(KEY, testimonials);
      res.status(200).json({ testimonial: testimonials[index] });
      return;
    }

    if (req.method === "DELETE") {
      const { id } = req.body || {};
      if (!id) {
        res.status(400).json({ error: "id is required." });
        return;
      }
      const next = testimonials.filter((t) => t.id !== id);
      await kv.set(KEY, next);
      res.status(200).json({ success: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
};
