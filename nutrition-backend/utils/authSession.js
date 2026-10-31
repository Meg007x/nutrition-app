const crypto = require("crypto");

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const createSession = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  };
};

const hashSessionToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

module.exports = { createSession, hashSessionToken };
