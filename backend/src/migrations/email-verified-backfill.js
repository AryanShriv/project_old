/**
 * Email verification backfill
 *
 * Accounts created before email verification existed have no `emailVerifiedAt` field. They are
 * marked verified (as of their sign-up date), so existing people are not suddenly blocked.
 * New accounts always get the field (null until they enter their code), so they are never touched.
 *
 * Runs on server start and is idempotent. Optional manual use:
 *   node src/migrations/email-verified-backfill.js dry-run
 *   node src/migrations/email-verified-backfill.js run
 */
const mongoose = require("mongoose");

const LEGACY = { emailVerifiedAt: { $exists: false } };

const backfillEmailVerified = async ({ dryRun = false } = {}) => {
  const users = mongoose.connection.db.collection("users");
  const toUpdate = await users.countDocuments(LEGACY);
  if (dryRun || toUpdate === 0) {
    return { success: true, dryRun, stats: { toUpdate, updated: 0 } };
  }
  const result = await users.updateMany(LEGACY, [{ $set: { emailVerifiedAt: { $ifNull: ["$createdAt", "$$NOW"] } } }]);
  return { success: true, dryRun, stats: { toUpdate, updated: result.modifiedCount } };
};

const ensureEmailVerifiedBackfill = async () => {
  const result = await backfillEmailVerified();
  if (result.stats.updated > 0) {
    // eslint-disable-next-line no-console
    console.log(`Email verification backfill: marked ${result.stats.updated} existing accounts as verified`);
  }
  return result;
};

const main = async () => {
  const command = process.argv[2];
  if (command !== "run" && command !== "dry-run") {
    // eslint-disable-next-line no-console
    console.log("Usage: node src/migrations/email-verified-backfill.js <dry-run|run>");
    process.exit(1);
  }
  const env = require("../config/env");
  await mongoose.connect(env.mongodbUri);
  try {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(await backfillEmailVerified({ dryRun: command === "dry-run" }), null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Backfill failed:", err);
    process.exit(1);
  });
}

module.exports = { backfillEmailVerified, ensureEmailVerifiedBackfill };
