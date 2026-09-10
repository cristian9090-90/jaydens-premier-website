/**
 * POST /api/change-password
 * Body: { currentPassword, newPassword }
 * Protected — requires a valid session cookie.
 */
const { kv } = require("@vercel/kv");
const { isAuthenticated, hashPassword, verifyPassword } = require("../lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password are required." });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters." });
    return;
  }

  try {
    const storedHash = await kv.get("admin:passwordHash");
    if (!storedHash || !verifyPassword(currentPassword, storedHash)) {
      res.status(401).json({ error: "Current password is incorrect." });
      return;
    }
    await kv.set("admin:passwordHash", hashPassword(newPassword));
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
};
