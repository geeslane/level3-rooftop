const { isAuthenticated } = require("./_lib/auth");
const { putFile, sanitizeFilename, getToken } = require("./_lib/github");
const { readJsonBody } = require("./_lib/body");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!getToken()) {
    return res.status(503).json({ error: "GITHUB_TOKEN is not configured." });
  }

  try {
    const { filename, content } = await readJsonBody(req);
    if (!filename || !content) {
      return res.status(400).json({ error: "filename and content required" });
    }

    const safeName = sanitizeFilename(filename);
    const filePath = `food/uploads/${Date.now()}-${safeName}`;
    await putFile(filePath, content, `Upload menu image: ${safeName}`);
    return res.status(200).json({ path: filePath });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
};
