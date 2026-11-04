const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpertProfile",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
      unique: true // One review per session
    },

    // PRD 4.1: the learner's own words lead the review. No star rating.
    whatILearned: { type: String, trim: true, required: true, minlength: 20, maxlength: 1000 },
    expertStyle: { type: String, enum: ["structured", "conversational", "hands_on", ""], default: "" },
    wouldRecommend: { type: Boolean, required: true },
    sessionType: { type: String, trim: true, default: "" }, // Copied from the request, not entered by the user

    // Legacy free-text comment from the first review form. Optional; kept for old reviews.
    comment: { type: String, trim: true, default: "" },

    // Admin moderation: hidden reviews are excluded from the profile and from the stats
    hidden: { type: Boolean, default: false, index: true },
    hiddenNote: { type: String, trim: true, default: "" },
    hiddenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    hiddenAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// Prevent a user from reviewing the same expert multiple times without a new session (handled by requestId unique constraint above, but we also index them together for queries)
reviewSchema.index({ expertId: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
