/**
 * POST /api/login
 * Body: { email, password }
 *
 * On the very first successful login, the password hash is created in
 * Vercel KV from the ADMIN_PASSWORD environment variable. After that,
 * the KV-stored hash is what's checked — so changing the password
 * later (see change-password.js) doesn't require touching env vars.
 *
 * Failed attempts are rate-limited per IP address (see MAX_ATTEMPTS /
 * WINDOW_SECONDS below) so the login form can't be brute-forced.
 */
const { kv } = require("@vercel/kv");
const { setSessionCookie, hashPassword, verifyPassword } = require("../lib/auth");

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

async function registerFailedAttempt(attemptsKey) {
  const count = await kv.incr(attemptsKey);
  if (count === 1) {
    await kv.expire(attemptsKey, WINDOW_SECONDS);
  }
}

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

  const attemptsKey = `login:attempts:${getClientIp(req)}`;

  try {
    const attempts = (await kv.get(attemptsKey)) || 0;
    if (attempts >= MAX_ATTEMPTS) {
      res.status(429).json({ error: "Too many attempts. Try again in a few minutes." });
      return;
    }
  } catch {
    // If the rate-limit check itself fails, fail open rather than
    // locking everyone out — the credential checks below still apply.
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    res.status(500).json({ error: "Server is not configured (missing ADMIN_EMAIL)." });
    return;
  }

  if (email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
    await registerFailedAttempt(attemptsKey);
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
        await registerFailedAttempt(attemptsKey);
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }
      storedHash = hashPassword(bootstrapPassword);
      await kv.set("admin:passwordHash", storedHash);
    } else if (!verifyPassword(password, storedHash)) {
      await registerFailedAttempt(attemptsKey);
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    await kv.del(attemptsKey);
    setSessionCookie(res);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong. Check server configuration and try again." });
  }
};
