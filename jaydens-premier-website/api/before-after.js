/**
 * /api/before-after
 *
 * GET   — public. Returns { beforeImage, afterImage, beforeAlt, afterAlt }.
 *         Used by the public site's "The transformation / Before & after"
 *         section. Any field left null shows the site's placeholder.
 * PUT   — protected. Body: { beforeImage?, afterImage?, beforeAlt?, afterAlt? }
 *         Partial update — only the fields sent are changed, so the admin
 *         panel can update just one photo without re-sending the other.
 *
 * Stored as a single object in Vercel KV under "site:beforeAfter".
 */
const { kv } = require("@vercel/kv");
const { isAuthenticated } = require("../lib/auth");

const KEY = "site:beforeAfter";
const DEFAULT_BEFORE_AFTER = { beforeImage: null, afterImage: null, beforeAlt: "", afterAlt: "" };

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const beforeAfter = (await kv.get(KEY)) || DEFAULT_BEFORE_AFTER;
      res.status(200).json(beforeAfter);
      return;
    }

    if (!isAuthenticated(req)) {
      res.status(401).json({ error: "Not signed in." });
      return;
    }

    if (req.method === "PUT") {
      const { beforeImage, afterImage, beforeAlt, afterAlt } = req.body || {};
      const current = (await kv.get(KEY)) || DEFAULT_BEFORE_AFTER;
      const next = {
        beforeImage: beforeImage ?? current.beforeImage,
        afterImage: afterImage ?? current.afterImage,
        beforeAlt: beforeAlt ?? current.beforeAlt,
        afterAlt: afterAlt ?? current.afterAlt
      };
      await kv.set(KEY, next);
      res.status(200).json(next);
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
};
