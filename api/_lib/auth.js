const crypto = require("crypto");

const COOKIE_NAME = "level3_admin";

function getSecret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function signToken() {
  return crypto.createHmac("sha256", getSecret()).update("level3-admin").digest("hex");
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf("=");
        return i === -1 ? [part, ""] : [part.slice(0, i), part.slice(i + 1)];
      })
  );
}

function isAuthenticated(req) {
  const secret = getSecret();
  if (!secret) return false;
  const cookies = parseCookies(req);
  return cookies[COOKIE_NAME] === signToken();
}

function sessionCookie() {
  const token = signToken();
  const secure = process.env.VERCEL ? " Secure;" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly;${secure} SameSite=Strict; Max-Age=86400`;
}

function clearCookie() {
  const secure = process.env.VERCEL ? " Secure;" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly;${secure} SameSite=Strict; Max-Age=0`;
}

module.exports = {
  COOKIE_NAME,
  isAuthenticated,
  sessionCookie,
  clearCookie,
  signToken,
};
