/**
 * /api/coverage
 *
 * GET   — public. Returns { counties, zip }. Used by the public site to
 *         color the New Jersey county map and place the location pin.
 * PUT   — protected. Body: { counties: string[], zip: string }
 *         Full replace — the admin panel always sends the complete
 *         checked-county list plus the current ZIP.
 *
 * Stored as a single object in Vercel KV under "site:coverage".
 * County names must match NJ_COUNTIES in admin.js / coverage-map.js
 * exactly (e.g. "Passaic", "Bergen") — no "County" suffix.
 */
const { kv } = require("@vercel/kv");
const { isAuthenticated } = require("../lib/auth");

const KEY = "site:coverage";
const DEFAULT_COVERAGE = { counties: ["Passaic"], zip: "07522" };

const ZIP_RE = /^\d{5}$/;

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const coverage = (await kv.get(KEY)) || DEFAULT_COVERAGE;
      res.status(200).json(coverage);
      return;
    }

    if (!isAuthenticated(req)) {
      res.status(401).json({ error: "Not signed in." });
      return;
    }

    if (req.method === "PUT") {
      const { counties, zip } = req.body || {};
      if (!Array.isArray(counties)) {
        res.status(400).json({ error: "counties must be an array of county names." });
        return;
      }
      if (!zip || !ZIP_RE.test(zip)) {
        res.status(400).json({ error: "zip must be a 5-digit ZIP code." });
        return;
      }
      const coverage = { counties, zip };
      await kv.set(KEY, coverage);
      res.status(200).json(coverage);
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
};
