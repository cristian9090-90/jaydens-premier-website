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
 */
const { put } = require("@vercel/blob");
const { isAuthenticated } = require("../lib/auth");

const MAX_BYTES = 4 * 1024 * 1024; // 4MB, leaving headroom under the 4.5MB request cap

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

  try {
    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const blob = await put(`projects/${Date.now()}-${safeName}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: true
    });
    res.status(200).json({ url: blob.url });
  } catch (err) {
    res.status(500).json({ error: "Upload failed. Check that Blob storage is connected and try again." });
  }
};
