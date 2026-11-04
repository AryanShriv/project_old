const crypto = require("crypto");
const bcrypt = require("bcryptjs");

/**
 * Six-digit email codes for verifying an email address and resetting a password.
 * Stored only as a bcrypt hash on the user (`emailVerification` / `passwordReset`), valid for
 * 15 minutes, invalidated after 5 wrong tries, and re-sendable at most once a minute.
 */
const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const newCode = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

/**
 * Create a fresh code in `user[field]` (not saved). Returns the plain code to email,
 * or { tooSoon: true, retryInSeconds } if a code was sent less than a minute ago.
 */
const issueCode = async (user, field, now = new Date()) => {
  const sentAt = user[field]?.sentAt;
  if (sentAt && now - sentAt < RESEND_COOLDOWN_MS) {
    return { tooSoon: true, retryInSeconds: Math.ceil((RESEND_COOLDOWN_MS - (now - sentAt)) / 1000) };
  }
  const code = newCode();
  user[field] = {
    codeHash: await bcrypt.hash(code, 10),
    expiresAt: new Date(now.getTime() + CODE_TTL_MS),
    attempts: 0,
    sentAt: now,
  };
  return { code };
};

/**
 * Check a code against `user[field]` and record the attempt (not saved).
 * Returns "ok", "invalid" (wrong code, tries remain), or "expired" (expired, used up, or never sent).
 */
const checkCode = async (user, field, code, now = new Date()) => {
  const record = user[field];
  if (!record?.codeHash || !record.expiresAt || record.expiresAt < now || record.attempts >= MAX_ATTEMPTS) {
    return "expired";
  }
  if (await bcrypt.compare(String(code).trim(), record.codeHash)) {
    user[field] = undefined;
    return "ok";
  }
  const attempts = (record.attempts || 0) + 1;
  user.set(`${field}.attempts`, attempts); // set() so Mongoose records the change on the nested path
  return attempts >= MAX_ATTEMPTS ? "expired" : "invalid";
};

module.exports = { issueCode, checkCode, MAX_ATTEMPTS };
