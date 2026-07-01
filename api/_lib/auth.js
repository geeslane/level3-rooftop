const crypto = require("crypto");

const COOKIE_NAME = "level3_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

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
        return i === -1 ? [part, ""] : [part.slice(0, i), decodeURIComponent(part.slice(i + 1))];
      })
  );
}

function isAuthenticated(req) {
  const secret = getSecret();
  if (!secret) return false;
  return parseCookies(req)[COOKIE_NAME] === signToken();
}

function setAuthCookie(res) {
  const token = signToken();
  const secure = process.env.VERCEL_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`
  );
}

function clearAuthCookie(res) {
  const secure = process.env.VERCEL_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  );
}

module.exports = { isAuthenticated, setAuthCookie, clearAuthCookie };
