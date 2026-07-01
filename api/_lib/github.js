const GITHUB_REPO = process.env.GITHUB_REPO || "geeslane/level3-rooftop";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

function getToken() {
  return process.env.GITHUB_TOKEN || "";
}

function githubHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function encodeRepoPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function getFile(path) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeRepoPath(path)}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "GitHub read failed");
  }
  return res.json();
}

async function putFile(path, base64Content, message, sha) {
  const body = { message, content: base64Content, branch: GITHUB_BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeRepoPath(path)}`, {
    method: "PUT",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "GitHub write failed");
  }
  return res.json();
}

function fromBase64(base64) {
  return Buffer.from(base64.replace(/\n/g, ""), "base64").toString("utf8");
}

function toBase64(text) {
  return Buffer.from(text, "utf8").toString("base64");
}

function sanitizeFilename(name) {
  const ext = (String(name).match(/\.[a-z0-9]+$/i) || [".jpg"])[0].toLowerCase();
  const base =
    String(name)
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "image";
  return base + ext;
}

module.exports = {
  getFile,
  putFile,
  fromBase64,
  toBase64,
  sanitizeFilename,
  getToken,
  GITHUB_REPO,
  GITHUB_BRANCH,
};
