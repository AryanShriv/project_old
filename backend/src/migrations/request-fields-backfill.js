/**
 * Request fields backfill (PRD 3.5)
 *
 * Copies legacy request fields into the new "Request a Session" fields:
 *   projectTitle                        -> headline
 *   description, falling back to userMessage -> description
 *   engagementType (onsite/ongoing, else remote) -> sessionType
 *
 * Additive and idempotent: legacy fields are left untouched, and only documents
 * without a headline are updated, so it is safe to run more than once.
 *
 * Usage:
 *   node src/migrations/request-fields-backfill.js dry-run   # count only, no writes
 *   node src/migrations/request-fields-backfill.js run
 */
const mongoose = require("mongoose");

const NEEDS_BACKFILL = { $or: [{ headline: { $exists: false } }, { headline: "" }] };

const backfillRequestFields = async ({ dryRun = false } = {}) => {
  const requests = mongoose.connection.db.collection("requests");
  const pending = await requests.countDocuments(NEEDS_BACKFILL);

  if (dryRun) {
    return { success: true, dryRun: true, stats: { toUpdate: pending, updated: 0 } };
  }

  const result = await requests.updateMany(NEEDS_BACKFILL, [
    {
      $set: {
        headline: { $ifNull: ["$projectTitle", ""] },
        description: {
          $cond: [
            { $gt: [{ $strLenCP: { $ifNull: ["$description", ""] } }, 0] },
            "$description",
            { $ifNull: ["$userMessage", ""] },
          ],
        },
        sessionType: {
          $cond: [{ $in: ["$engagementType", ["onsite", "ongoing"]] }, "$engagementType", "remote"],
        },
      },
    },
  ]);

  return { success: true, dryRun: false, stats: { toUpdate: pending, updated: result.modifiedCount } };
};

const main = async () => {
  const command = process.argv[2];
  if (command !== "run" && command !== "dry-run") {
    // eslint-disable-next-line no-console
    console.log("Usage: node src/migrations/request-fields-backfill.js <dry-run|run>");
    process.exit(1);
  }

  const env = require("../config/env");
  await mongoose.connect(env.mongodbUri);
  try {
    const result = await backfillRequestFields({ dryRun: command === "dry-run" });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
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

module.exports = { backfillRequestFields };
