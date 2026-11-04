/**
 * Trust fields backfill (PRD Phase 2)
 *
 * Additive and idempotent. Legacy fields are never removed.
 *   Experts:  engagementType ("remote" | "onsite" | "both") -> engagementTypes[]
 *             availabilityRadius -> onsiteRadiusKm
 *             certifications[].body -> certifications[].issuingBody
 *   Reviews:  comment -> whatILearned (when empty)
 *             free-text expertStyle -> structured | conversational | hands_on | ""
 *   Stats:    reviewCount, recommendedCount, recommendPercentage, styleBreakdown recalculated
 *             from visible reviews for every expert
 *
 * Usage:
 *   node src/migrations/trust-fields-backfill.js dry-run   # counts only, no writes
 *   node src/migrations/trust-fields-backfill.js run
 */
const mongoose = require("mongoose");
const { recomputeExpertReviewStats } = require("../modules/reviews/reviews.stats");

const STYLE_PATTERNS = [
  [/struct|method|systematic|organi[sz]ed/i, "structured"],
  [/convers|friendly|chat|listen|patient/i, "conversational"],
  [/hands|practical|demo|show/i, "hands_on"],
];

const normaliseStyle = (value) => {
  if (["structured", "conversational", "hands_on", ""].includes(value)) return value;
  const match = STYLE_PATTERNS.find(([pattern]) => pattern.test(value || ""));
  return match ? match[1] : "";
};

const engagementTypesFor = (legacy) =>
  legacy === "both" ? ["remote", "onsite"] : legacy === "onsite" ? ["onsite"] : ["remote"];

const backfillTrustFields = async ({ dryRun = false } = {}) => {
  const db = mongoose.connection.db;
  const experts = db.collection("expertprofiles");
  const reviews = db.collection("reviews");
  const stats = { expertsUpdated: 0, reviewsUpdated: 0, statsRecomputed: 0 };

  for await (const expert of experts.find({})) {
    const set = {};
    if (!Array.isArray(expert.engagementTypes) || expert.engagementTypes.length === 0) {
      set.engagementTypes = engagementTypesFor(expert.engagementType);
    }
    if (!expert.onsiteRadiusKm && expert.availabilityRadius > 0) {
      set.onsiteRadiusKm = expert.availabilityRadius;
    }
    const certs = expert.certifications || [];
    if (certs.some((c) => !c.issuingBody && c.body)) {
      set.certifications = certs.map((c) => ({ ...c, issuingBody: c.issuingBody || c.body || "" }));
    }
    if (Object.keys(set).length > 0) {
      stats.expertsUpdated += 1;
      if (!dryRun) await experts.updateOne({ _id: expert._id }, { $set: set });
    }
  }

  for await (const review of reviews.find({})) {
    const set = {};
    if (!review.whatILearned && review.comment) set.whatILearned = review.comment;
    const style = normaliseStyle(review.expertStyle);
    if (style !== review.expertStyle) set.expertStyle = style;
    if (review.hidden === undefined) set.hidden = false;
    if (Object.keys(set).length > 0) {
      stats.reviewsUpdated += 1;
      if (!dryRun) await reviews.updateOne({ _id: review._id }, { $set: set });
    }
  }

  if (!dryRun) {
    for await (const expert of experts.find({}, { projection: { _id: 1 } })) {
      await recomputeExpertReviewStats(expert._id);
      stats.statsRecomputed += 1;
    }
  }

  return { success: true, dryRun, stats };
};

const main = async () => {
  const command = process.argv[2];
  if (command !== "run" && command !== "dry-run") {
    // eslint-disable-next-line no-console
    console.log("Usage: node src/migrations/trust-fields-backfill.js <dry-run|run>");
    process.exit(1);
  }

  const env = require("../config/env");
  await mongoose.connect(env.mongodbUri);
  try {
    const result = await backfillTrustFields({ dryRun: command === "dry-run" });
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

module.exports = { backfillTrustFields, normaliseStyle };
