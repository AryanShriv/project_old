const mongoose = require("mongoose");
const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const Review = require("./review.model");
const Request = require("../requests/request.model");
const AuditLog = require("../admin/audit-log.model");
const { REVIEW_STYLES } = require("../../constants/trust");
const { recomputeExpertReviewStats } = require("./reviews.stats");

const PUBLIC_REVIEW_FIELDS = "-hiddenNote -hiddenBy -hiddenAt -hidden";

const submitSchema = z.object({
  requestId: z.string().trim().min(1),
  whatILearned: z.string().trim().min(20, "Tell us a little more: at least 20 characters").max(1000),
  expertStyle: z.enum(REVIEW_STYLES),
  wouldRecommend: z.boolean(),
});

const visibilitySchema = z
  .object({
    hidden: z.boolean(),
    note: z.string().trim().max(1000).optional().default(""),
  })
  .refine((data) => !data.hidden || data.note.length >= 5, {
    message: "Add a short note explaining why the review is hidden",
    path: ["note"],
  });

const adminListSchema = z.object({
  expertId: z.string().trim().optional(),
  hidden: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Public: visible reviews for an expert
 */
const getExpertReviews = async (req, res) => {
  const { expertId } = req.params;
  if (!mongoose.isValidObjectId(expertId)) {
    return sendError(res, "Invalid expert ID", 400);
  }

  const reviews = await Review.find({ expertId, hidden: { $ne: true } })
    .select(PUBLIC_REVIEW_FIELDS)
    .populate("userId", "profile.fullName profile.avatarUrl")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { items: reviews }, "Reviews fetched");
};

/**
 * Only the user who had the session can review it, only once the expert has marked it
 * complete, and only once per session (PRD 4.1).
 */
const submitReview = async (req, res) => {
  const { expertId } = req.params;
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid review", 400, parsed.error.flatten());
  }
  const { requestId, whatILearned, expertStyle, wouldRecommend } = parsed.data;

  if (!mongoose.isValidObjectId(expertId) || !mongoose.isValidObjectId(requestId)) {
    return sendError(res, "Invalid expert or request ID", 400);
  }

  const session = await Request.findOne({
    _id: requestId,
    userId: req.auth.sub,
    expertId,
    status: "completed",
  });
  if (!session) {
    return sendError(res, "You can review an expert once they have marked your session complete.", 403);
  }
  if (session.reviewedAt) {
    return sendError(res, "You have already reviewed this session.", 409);
  }

  let review;
  try {
    review = await Review.create({
      expertId,
      userId: req.auth.sub,
      requestId,
      whatILearned,
      expertStyle,
      wouldRecommend,
      sessionType: session.sessionType || session.engagementType || "",
    });
  } catch (err) {
    // Unique index on requestId catches a double submit racing past the check above
    if (err.code === 11000) {
      return sendError(res, "You have already reviewed this session.", 409);
    }
    throw err;
  }

  session.reviewedAt = new Date();
  await session.save();
  await recomputeExpertReviewStats(expertId);

  const populated = await Review.findById(review._id)
    .select(PUBLIC_REVIEW_FIELDS)
    .populate("userId", "profile.fullName profile.avatarUrl")
    .lean();
  return sendSuccess(res, populated, "Thank you for your review", 201);
};

/**
 * Admin: list reviews, including hidden ones, for moderation
 */
const listReviewsForAdmin = async (req, res) => {
  const parsed = adminListSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, "Invalid query parameters", 400, parsed.error.flatten());
  }
  const { expertId, hidden, page, limit } = parsed.data;
  const filter = {};
  if (expertId && mongoose.isValidObjectId(expertId)) filter.expertId = expertId;
  if (hidden) filter.hidden = hidden === "true" ? true : { $ne: true };

  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate("userId", "email profile.fullName")
      .populate("expertId", "fullName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);
  return sendSuccess(res, { items, pagination: { page, limit, total } }, "Reviews fetched");
};

/**
 * Admin: hide a review (with a note) or show it again (PRD 4.1)
 */
const setReviewVisibility = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, "Invalid review id", 400);
  }
  const parsed = visibilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid payload", 400, parsed.error.flatten());
  }
  const { hidden, note } = parsed.data;

  // updateOne skips full-document validation, so legacy reviews can still be moderated
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    {
      $set: hidden
        ? { hidden: true, hiddenNote: note, hiddenBy: req.auth.sub, hiddenAt: new Date() }
        : { hidden: false, hiddenNote: note, hiddenBy: req.auth.sub, hiddenAt: null },
    },
    { new: true }
  ).lean();
  if (!review) {
    return sendError(res, "Review not found", 404);
  }

  await recomputeExpertReviewStats(review.expertId);
  await AuditLog.create({
    actorId: req.auth.sub,
    action: hidden ? "review_hidden" : "review_unhidden",
    entityType: "review",
    entityId: review._id.toString(),
    metadata: { note, expertId: review.expertId.toString() },
  });

  return sendSuccess(res, review, hidden ? "Review hidden" : "Review visible again");
};

module.exports = { getExpertReviews, submitReview, listReviewsForAdmin, setReviewVisibility };
