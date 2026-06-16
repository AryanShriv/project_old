const mongoose = require("mongoose");
const { sendSuccess, sendError } = require("../../utils/http");
const Review = require("./review.model");
const ExpertProfile = require("../experts/expert.model");
const Request = require("../requests/request.model");

/**
 * Get all reviews for a specific expert
 */
const getExpertReviews = async (req, res) => {
  const { expertId } = req.params;

  if (!mongoose.isValidObjectId(expertId)) {
    return sendError(res, "Invalid expert ID", 400);
  }

  try {
    const reviews = await Review.find({ expertId })
      .populate("userId", "profile.fullName profile.avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, { items: reviews }, "Reviews fetched");
  } catch (err) {
    console.error("Error fetching reviews:", err);
    return sendError(res, "Server error", 500);
  }
};

/**
 * Submit a new review for an expert
 * Enforces that the user has a completed session with the expert
 */
const submitReview = async (req, res) => {
  const { expertId } = req.params;
  const userId = req.auth.sub; // From JWT
  const { requestId, comment, whatILearned, expertStyle, wouldRecommend, sessionType } = req.body;

  if (!mongoose.isValidObjectId(expertId) || !mongoose.isValidObjectId(requestId)) {
    return sendError(res, "Invalid expert or request ID", 400);
  }

  if (!comment || comment.length < 10) {
    return sendError(res, "Invalid review data. Comment (min 10 chars) is required.", 400);
  }

  try {
    // 1. Verify that the request exists, belongs to this user and expert, and is COMPLETED
    const session = await Request.findOne({
      _id: requestId,
      userId: userId,
      expertId: expertId,
      status: "completed"
    });

    if (!session) {
      return sendError(res, "You can only review experts after completing a session with them.", 403);
    }

    // 2. Check if a review already exists for this specific session
    const existingReview = await Review.findOne({ requestId });
    if (existingReview) {
      return sendError(res, "You have already reviewed this session.", 400);
    }

    // 3. Create the review
    const review = new Review({
      expertId,
      userId,
      requestId,
      comment,
      whatILearned,
      expertStyle,
      wouldRecommend,
      sessionType
    });

    await review.save();

    // 4. Update the expert's review count and recommendation count
    const expert = await ExpertProfile.findById(expertId);
    if (expert) {
      expert.reviewCount = expert.reviewCount + 1;
      if (wouldRecommend) {
        expert.recommendedCount = (expert.recommendedCount || 0) + 1;
      }
      await expert.save();
    }

    // Populate user info before returning
    const populatedReview = await Review.findById(review._id)
      .populate("userId", "profile.fullName profile.avatarUrl")
      .lean();

    return sendSuccess(res, populatedReview, "Review submitted successfully");
  } catch (err) {
    console.error("Error submitting review:", err);
    // Handle unique index error for requestId just in case of race condition
    if (err.code === 11000) {
      return sendError(res, "You have already reviewed this session.", 400);
    }
    return sendError(res, "Server error", 500);
  }
};

module.exports = {
  getExpertReviews,
  submitReview
};
