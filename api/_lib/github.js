const MENU_PATH = "content/menu.json";

function githubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) return null;
  return { token, repo, branch };
}

async function getMenuFromGitHub() {
  const cfg = githubConfig();
  if (!cfg) return null;

  const url = `https://api.github.com/repos/${cfg.repo}/contents/${MENU_PATH}?ref=${cfg.branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) return null;

  const file = await res.json();
  const text = Buffer.from(file.content, "base64").toString("utf8");
  return { data: JSON.parse(text), sha: file.sha };
}

async function getMenuFromStatic(req) {
  const host = req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const base = host ? `${proto}://${host}` : "";
  const res = await fetch(`${base}/${MENU_PATH}`);
  if (!res.ok) throw new Error("Static menu not found");
  return { data: await res.json() };
}

async function getMenu(req) {
  const fromGitHub = await getMenuFromGitHub();
  if (fromGitHub) return fromGitHub.data;
  const fromStatic = await getMenuFromStatic(req);
  return fromStatic.data;
}

async function saveMenuToGitHub(menuData) {
  const cfg = githubConfig();
  if (!cfg) {
    throw new Error("GitHub is not configured. Set GITHUB_TOKEN and GITHUB_REPO in Vercel.");
  }

  const existing = await getMenuFromGitHub();
  const content = Buffer.from(JSON.stringify(menuData, null, 2) + "\n").toString("base64");

  const body = {
    message: "Update menu via admin",
    content,
    branch: cfg.branch,
  };
  if (existing?.sha) body.sha = existing.sha;

  const url = `https://api.github.com/repos/${cfg.repo}/contents/${MENU_PATH}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to save menu to GitHub");
  }

  return res.json();
}

async function getFileFromGitHub(filePath) {
  const cfg = githubConfig();
  if (!cfg) return null;

  const url = `https://api.github.com/repos/${cfg.repo}/contents/${filePath}?ref=${cfg.branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const file = await res.json();
  return { sha: file.sha, content: file.content };
}

function sanitizeFilename(name) {
  return String(name)
    .toLowerCase()
    .replace(/\.[^.]+$/, (ext) => ext.toLowerCase())
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "image";
}

async function uploadImageToGitHub(filename, base64Content) {
  const cfg = githubConfig();
  if (!cfg) {
    throw new Error("GitHub is not configured. Set GITHUB_TOKEN and GITHUB_REPO in Vercel.");
  }

  const ext = (filename.match(/\.[a-z0-9]+$/i) || [".jpg"])[0].toLowerCase();
  const safeName = sanitizeFilename(filename).replace(/\.[^.]+$/, "") + ext;
  const filePath = `food/uploads/${Date.now()}-${safeName}`;

  const existing = await getFileFromGitHub(filePath);
  const body = {
    message: `Upload menu image: ${safeName}`,
    content: base64Content,
    branch: cfg.branch,
  };
  if (existing?.sha) body.sha = existing.sha;

  const url = `https://api.github.com/repos/${cfg.repo}/contents/${filePath}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to upload image");
  }

  return { path: filePath };
}

module.exports = {
  getMenu,
  saveMenuToGitHub,
  uploadImageToGitHub,
  githubConfig,
};
