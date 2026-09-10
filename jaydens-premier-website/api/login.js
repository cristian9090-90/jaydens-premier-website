/**
 * POST /api/login
 * Body: { email, password }
 *
 * On the very first successful login, the password hash is created in
 * Vercel KV from the ADMIN_PASSWORD environment variable. After that,
 * the KV-stored hash is what's checked — so changing the password
 * later (see change-password.js) doesn't require touching env vars.
 */
const { kv } = require("@vercel/kv");
const { setSessionCookie, hashPassword, verifyPassword } = require("../lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    res.status(500).json({ error: "Server is not configured (missing ADMIN_EMAIL)." });
    return;
  }

  if (email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  try {
    let storedHash = await kv.get("admin:passwordHash");

    if (!storedHash) {
      const bootstrapPassword = process.env.ADMIN_PASSWORD;
      if (!bootstrapPassword) {
        res.status(500).json({ error: "Server is not configured (missing ADMIN_PASSWORD)." });
        return;
      }
      if (password !== bootstrapPassword) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }
      storedHash = hashPassword(bootstrapPassword);
      await kv.set("admin:passwordHash", storedHash);
    } else if (!verifyPassword(password, storedHash)) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    setSessionCookie(res);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong. Check server configuration and try again." });
  }
};
