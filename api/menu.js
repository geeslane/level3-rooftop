const { isAuthenticated } = require("./_lib/auth");
const { getMenu, saveMenuToGitHub } = require("./_lib/github");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    try {
      const data = await getMenu(req);
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message || "Failed to load menu" });
    }
  }

  if (req.method === "POST") {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: "Not signed in" });
    }

    try {
      const menuData = req.body;
      if (!menuData?.categories || !Array.isArray(menuData.categories)) {
        return res.status(400).json({ error: "Invalid menu data" });
      }

      menuData.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          if (!item.badge) delete item.badge;
        });
      });

      await saveMenuToGitHub(menuData);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Failed to save menu" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
