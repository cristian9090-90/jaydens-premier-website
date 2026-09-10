/**
 * lib/auth.js
 * ---------------------------------------------------------------
 * Shared authentication helpers for the /api routes.
 *
 * Session: a signed cookie (HMAC-SHA256 with SESSION_SECRET), not a
 * database session — no extra storage needed, just verified on each
 * request. It carries no personal data, only an issued-at timestamp.
 *
 * Password: stored as a salted scrypt hash in Vercel KV, under the key
 * "admin:passwordHash". On the very first login, if that key doesn't
 * exist yet, it's created from the ADMIN_PASSWORD environment variable
 * (see /api/login.js). From then on, changing the password (see
 * /api/change-password.js) only touches that KV entry — the
 * environment variable is never modified and is only a one-time
 * bootstrap value.
 * ---------------------------------------------------------------
 */
const crypto = require("crypto");

const SESSION_COOKIE = "jp_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is not set. Add it in your Vercel project settings."
    );
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function createSessionToken() {
  const payload = JSON.stringify({ iat: Date.now() });
  const base = Buffer.from(payload).toString("base64url");
  const signature = sign(base);
  return `${base}.${signature}`;
}

function isSessionTokenValid(token) {
  if (!token || !token.includes(".")) return false;
  const [base, signature] = token.split(".");
  let expected;
  try {
    expected = sign(base);
  } catch {
    return false;
  }
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;
  try {
    const payload = JSON.parse(Buffer.from(base, "base64url").toString("utf8"));
    const ageSeconds = (Date.now() - payload.iat) / 1000;
    return ageSeconds >= 0 && ageSeconds < SESSION_MAX_AGE_SECONDS;
  } catch {
    return false;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  return isSessionTokenValid(cookies[SESSION_COOKIE]);
}

function setSessionCookie(res) {
  const token = createSessionToken();
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  );
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  try {
    const hashBuffer = Buffer.from(hash, "hex");
    const candidateBuffer = crypto.scryptSync(password, salt, 64);
    if (hashBuffer.length !== candidateBuffer.length) return false;
    return crypto.timingSafeEqual(hashBuffer, candidateBuffer);
  } catch {
    return false;
  }
}

module.exports = {
  isAuthenticated,
  setSessionCookie,
  clearSessionCookie,
  hashPassword,
  verifyPassword
};
