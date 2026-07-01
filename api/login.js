const { sessionCookie } = require("./_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(503).json({ error: "Admin login is not configured on the server." });
  }

  const { password } = req.body || {};
  if (password !== adminPassword) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  res.setHeader("Set-Cookie", sessionCookie());
  return res.status(200).json({ ok: true });
};
