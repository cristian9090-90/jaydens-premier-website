/**
 * POST /api/upload
 * Body: { filename, dataBase64, contentType }
 * Protected — requires a valid session cookie.
 *
 * Images are sent as base64 in a JSON body (not multipart) to keep this
 * endpoint dependency-free. Vercel's serverless functions cap the
 * request body at 4.5MB, and base64 inflates size by about a third —
 * so keep source photos under roughly 3MB before uploading. The admin
 * panel warns about this in the upload form.
 *
 * The claimed `contentType` from the browser is never trusted on its
 * own — the actual file bytes are checked against known image
 * signatures (JPEG/PNG/WebP) before anything is stored, so a
 * non-image file can't be uploaded just by relabeling it.
 */
const { put } = require("@vercel/blob");
const { isAuthenticated } = require("../lib/auth");

const MAX_BYTES = 4 * 1024 * 1024; // 4MB, leaving headroom under the 4.5MB request cap

// Detects the real image type from the first bytes of the file,
// regardless of what the browser claims. Returns null if it doesn't
// match any allowed image format.
function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }

  const { filename, dataBase64, contentType } = req.body || {};
  if (!filename || !dataBase64 || !contentType) {
    res.status(400).json({ error: "filename, dataBase64, and contentType are required." });
    return;
  }
  if (!contentType.startsWith("image/")) {
    res.status(400).json({ error: "Only image uploads are allowed." });
    return;
  }

  let buffer;
  try {
    buffer = Buffer.from(dataBase64, "base64");
  } catch {
    res.status(400).json({ error: "Invalid image data." });
    return;
  }

  if (buffer.length > MAX_BYTES) {
    res.status(400).json({ error: "Image must be under 4MB. Compress the photo and try again." });
    return;
  }

  const realType = detectImageType(buffer);
  if (!realType) {
    res.status(400).json({ error: "That file doesn't look like a valid JPG, PNG, or WebP image." });
    return;
  }

  try {
    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const blob = await put(`projects/${Date.now()}-${safeName}`, buffer, {
      access: "public",
      contentType: realType,
      addRandomSuffix: true
    });
    res.status(200).json({ url: blob.url });
  } catch (err) {
    res.status(500).json({ error: "Upload failed. Check that Blob storage is connected and try again." });
  }
};
