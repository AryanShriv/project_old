/**
 * Availability: rename freelancerId -> expertId (PRD Phase 3 cleanup)
 *
 * The `availabilities` and `availabilityexceptions` collections stored the expert's profile id
 * under the retired name `freelancerId`. This renames the field to `expertId` and replaces the
 * old indexes with the new ones.
 *
 * Why it also runs on server start: the old indexes are unique, and records saved by the new code
 * have no `freelancerId`, so leaving the old indexes in place would make two experts' records
 * clash. Running it at startup keeps the code and the data in step on every deploy. It is
 * idempotent: once done, it finds nothing to change.
 *
 * Usage (optional, e.g. to preview before a deploy):
 *   node src/migrations/availability-expert-id.js dry-run   # counts only, no writes
 *   node src/migrations/availability-expert-id.js run
 */
const mongoose = require("mongoose");

const COLLECTIONS = ["availabilities", "availabilityexceptions"];

const legacyIndexesOf = async (collection) => {
  try {
    const indexes = await collection.indexes();
    return indexes.filter((index) => Object.keys(index.key).includes("freelancerId")).map((index) => index.name);
  } catch (err) {
    if (err.codeName === "NamespaceNotFound") return []; // collection doesn't exist yet
    throw err;
  }
};

const renameAvailabilityExpertId = async ({ dryRun = false } = {}) => {
  const db = mongoose.connection.db;
  const stats = {};

  for (const name of COLLECTIONS) {
    const collection = db.collection(name);
    const needsRename = { freelancerId: { $exists: true }, expertId: { $exists: false } };
    const toRename = await collection.countDocuments(needsRename);
    const legacyIndexes = await legacyIndexesOf(collection);

    if (dryRun) {
      stats[name] = { toRename, renamed: 0, legacyIndexes, droppedIndexes: [] };
      continue;
    }

    // Drop the old indexes first, so the rename can't trip their unique constraints
    for (const indexName of legacyIndexes) {
      await collection.dropIndex(indexName);
    }
    const result = toRename > 0 ? await collection.updateMany(needsRename, { $rename: { freelancerId: "expertId" } }) : null;
    stats[name] = { toRename, renamed: result?.modifiedCount ?? 0, legacyIndexes, droppedIndexes: legacyIndexes };
  }

  if (!dryRun) {
    // Build the new expertId indexes now that every record has the field
    await Promise.all([
      require("../modules/availability/availability.model").createIndexes(),
      require("../modules/availability/availability-exception.model").createIndexes(),
    ]);
  }

  return { success: true, dryRun, stats };
};

/** Called on server start; logs only when it changed something */
const ensureAvailabilityExpertId = async () => {
  const result = await renameAvailabilityExpertId();
  const changed = Object.values(result.stats).some((s) => s.renamed > 0 || s.droppedIndexes.length > 0);
  if (changed) {
    // eslint-disable-next-line no-console
    console.log("Availability freelancerId -> expertId migration:", JSON.stringify(result.stats));
  }
  return result;
};

const main = async () => {
  const command = process.argv[2];
  if (command !== "run" && command !== "dry-run") {
    // eslint-disable-next-line no-console
    console.log("Usage: node src/migrations/availability-expert-id.js <dry-run|run>");
    process.exit(1);
  }

  const env = require("../config/env");
  await mongoose.connect(env.mongodbUri);
  try {
    const result = await renameAvailabilityExpertId({ dryRun: command === "dry-run" });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Migration failed:", err);
    process.exit(1);
  });
}

module.exports = { renameAvailabilityExpertId, ensureAvailabilityExpertId };
