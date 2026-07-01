const GITHUB_REPO = "geeslane/level3-rooftop";
const GITHUB_BRANCH = "main";
const MENU_PATH = "content/menu.json";
const TOKEN_KEY = "github_token";

function getGitHubToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

function setGitHubToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function toBase64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function fromBase64(base64) {
  return decodeURIComponent(escape(atob(base64.replace(/\n/g, ""))));
}

function sanitizeFilename(name) {
  const ext = (String(name).match(/\.[a-z0-9]+$/i) || [".jpg"])[0].toLowerCase();
  const base = String(name)
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "image";
  return base + ext;
}

function encodeRepoPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function githubGetFile(token, path) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeRepoPath(path)}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Could not read from GitHub");
  }
  return res.json();
}

async function githubPutFile(token, path, base64Content, message, sha) {
  const body = { message, content: base64Content, branch: GITHUB_BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeRepoPath(path)}`, {
    method: "PUT",
    headers: { ...githubHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Could not save to GitHub");
  }
  return res.json();
}

async function loadMenuFromRepo() {
  const token = getGitHubToken();
  if (token) {
    try {
      const file = await githubGetFile(token, MENU_PATH);
      if (file) return JSON.parse(fromBase64(file.content));
    } catch (_) {}
  }

  try {
    const url = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${MENU_PATH}?t=${Date.now()}`;
    const res = await fetch(url);
    if (res.ok) return res.json();
  } catch (_) {}

  const res = await fetch("content/menu.json");
  if (!res.ok) throw new Error("Menu not found");
  return res.json();
}

async function saveMenuToRepo(menuData) {
  const token = getGitHubToken();
  if (!token) throw new Error("GitHub token required. Sign out and sign in again with your token.");

  const existing = await githubGetFile(token, MENU_PATH);
  const content = toBase64(JSON.stringify(menuData, null, 2) + "\n");
  await githubPutFile(token, MENU_PATH, content, "Update menu via admin", existing?.sha);
}

async function uploadMenuImage(filename, base64Content) {
  const token = getGitHubToken();
  if (!token) throw new Error("GitHub token required. Sign out and sign in again with your token.");

  const safeName = sanitizeFilename(filename);
  const filePath = `food/uploads/${Date.now()}-${safeName}`;
  await githubPutFile(token, filePath, base64Content, `Upload menu image: ${safeName}`);
  return { path: filePath };
}
