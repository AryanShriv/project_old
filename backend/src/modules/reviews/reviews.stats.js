const mongoose = require("mongoose");
const Review = require("./review.model");
const ExpertProfile = require("../experts/expert.model");

/**
 * Recalculate an expert's review numbers from their visible reviews. Called after every
 * submit, hide and unhide, so hidden reviews never count and the numbers cannot drift.
 */
const recomputeExpertReviewStats = async (expertId) => {
  const [stats] = await Review.aggregate([
    { $match: { expertId: new mongoose.Types.ObjectId(String(expertId)), hidden: { $ne: true } } },
    {
      $group: {
        _id: null,
        reviewCount: { $sum: 1 },
        recommendedCount: { $sum: { $cond: ["$wouldRecommend", 1, 0] } },
        structured: { $sum: { $cond: [{ $eq: ["$expertStyle", "structured"] }, 1, 0] } },
        conversational: { $sum: { $cond: [{ $eq: ["$expertStyle", "conversational"] }, 1, 0] } },
        hands_on: { $sum: { $cond: [{ $eq: ["$expertStyle", "hands_on"] }, 1, 0] } },
      },
    },
  ]);

  const reviewCount = stats?.reviewCount ?? 0;
  const recommendedCount = stats?.recommendedCount ?? 0;
  const update = {
    reviewCount,
    recommendedCount,
    recommendPercentage: reviewCount > 0 ? Math.round((recommendedCount / reviewCount) * 100) : null,
    styleBreakdown: {
      structured: stats?.structured ?? 0,
      conversational: stats?.conversational ?? 0,
      hands_on: stats?.hands_on ?? 0,
    },
  };
  await ExpertProfile.updateOne({ _id: expertId }, { $set: update });
  return update;
};

module.exports = { recomputeExpertReviewStats };
