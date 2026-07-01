const { readJsonBody } = require("./_lib/body");
const { isAuthenticated, setAuthCookie } = require("./_lib/auth");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    if (isAuthenticated(req)) return res.status(200).json({ ok: true });
    return res.status(401).json({ ok: false });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expected = (process.env.ADMIN_PASSWORD || "").trim();
  if (!expected) {
    return res.status(503).json({ error: "ADMIN_PASSWORD is not set in Vercel environment variables." });
  }

  try {
    const body = await readJsonBody(req);
    const password = String(body.password ?? "").trim();
    if (password !== expected) {
      return res.status(401).json({ error: "Incorrect password." });
    }
    setAuthCookie(res);
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(400).json({ error: "Invalid request." });
  }
};
