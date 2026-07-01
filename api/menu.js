const { isAuthenticated } = require("./_lib/auth");
const { getFile, putFile, fromBase64, toBase64, getToken, GITHUB_REPO, GITHUB_BRANCH } = require("./_lib/github");
const { readJsonBody } = require("./_lib/body");

const MENU_PATH = "content/menu.json";

async function loadMenu() {
  if (getToken()) {
    try {
      const file = await getFile(MENU_PATH);
      if (file) return JSON.parse(fromBase64(file.content));
    } catch (_) {}
  }

  const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${MENU_PATH}`);
  if (res.ok) return res.json();
  throw new Error("Menu not found");
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      return res.status(200).json(await loadMenu());
    } catch (err) {
      return res.status(500).json({ error: err.message || "Could not load menu" });
    }
  }

  if (req.method === "POST") {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!getToken()) {
      return res.status(503).json({ error: "GITHUB_TOKEN is not configured." });
    }

    try {
      const menuData = await readJsonBody(req);
      const existing = await getFile(MENU_PATH);
      const content = toBase64(JSON.stringify(menuData, null, 2) + "\n");
      await putFile(MENU_PATH, content, "Update menu via admin", existing?.sha);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Could not save menu" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
};
