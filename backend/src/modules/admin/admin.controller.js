const mongoose = require("mongoose");
const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const Application = require("../applications/application.model");
const User = require("../users/user.model");
const ExpertProfile = require("../experts/expert.model");
const AuditLog = require("./audit-log.model");

const listApplicationsSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const reviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(1000).optional().default(""),
});

const statusSchema = z.object({
  status: z.enum(["active", "suspended"]),
  note: z.string().trim().max(1000).optional().default(""),
});

const listApplications = async (req, res) => {
  const parsed = listApplicationsSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, "Invalid query parameters", 400, parsed.error.flatten());
  }

  const { status, page, limit } = parsed.data;
  const filter = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Application.find(filter)
      .populate("applicantUserId", "email profile.fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  const mapped = items.map((item) => ({
    ...item,
    email: item.applicantUserId?.email || "",
    name: item.applicantUserId?.profile?.fullName || "",
    expertProfileId: item.expertProfileId?.toString?.() || "",
  }));

  return sendSuccess(res, { items: mapped, pagination: { page, limit, total } }, "Applications fetched");
};

const reviewApplication = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, "Invalid application id", 400);
  }

  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid review payload", 400, parsed.error.flatten());
  }

  const application = await Application.findById(req.params.id);
  if (!application) {
    return sendError(res, "Application not found", 404);
  }
  if (application.status !== "pending") {
    return sendError(res, "Only pending applications can be reviewed", 400);
  }

  const decision = parsed.data.decision;
  const reviewedBy = req.auth.sub;
  application.status = decision;
  application.review = {
    reviewedBy,
    reviewedAt: new Date(),
    note: parsed.data.note,
  };
  await application.save();

  const accountStatus = decision === "approved" ? "active" : "pending_review";
  const profileStatus = decision === "approved" ? "active" : "pending_review";

  await Promise.all([
    User.findByIdAndUpdate(application.applicantUserId, { $set: { accountStatus } }),
    ExpertProfile.findByIdAndUpdate(application.expertProfileId, {
      $set: {
        profileStatus,
        approvalStatus: decision,
        ...(decision === "approved"
          ? { approvedAt: new Date(), ...application.submission }
          : { rejectionReason: parsed.data.note || "Application not approved." }),
      },
    }),
    AuditLog.create({
      actorId: reviewedBy,
      action: "application_reviewed",
      entityType: "application",
      entityId: application._id.toString(),
      metadata: {
        decision,
        note: parsed.data.note,
        applicantUserId: application.applicantUserId.toString(),
      },
    }),
  ]);

  return sendSuccess(res, application, "Application reviewed");
};

const setExpertStatus = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, "Invalid expert id", 400);
  }

  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid status payload", 400, parsed.error.flatten());
  }

  const expert = await ExpertProfile.findById(req.params.id);
  if (!expert) {
    return sendError(res, "Expert not found", 404);
  }

  const accountStatus = parsed.data.status === "active" ? "active" : "suspended";
  const profileStatus = parsed.data.status === "active" ? "active" : "suspended";

  await Promise.all([
    ExpertProfile.findByIdAndUpdate(expert._id, { $set: { profileStatus } }),
    User.findByIdAndUpdate(expert.userId, { $set: { accountStatus } }),
    AuditLog.create({
      actorId: req.auth.sub,
      action: "expert_status_updated",
      entityType: "expert_profile",
      entityId: expert._id.toString(),
      metadata: {
        status: parsed.data.status,
        note: parsed.data.note,
        userId: expert.userId.toString(),
      },
    }),
  ]);

  return sendSuccess(
    res,
    { expertId: expert._id, userId: expert.userId, status: parsed.data.status },
    "Expert status updated"
  );
};

const listAuditLogs = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 30), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AuditLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments({}),
  ]);

  return sendSuccess(res, { items, pagination: { page, limit, total } }, "Audit logs fetched");
};

module.exports = {
  listApplications,
  reviewApplication,
  setExpertStatus,
  listAuditLogs,
};
