const mongoose = require("mongoose");
const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const Application = require("../applications/application.model");
const User = require("../users/user.model");
const ExpertProfile = require("../experts/expert.model");
const AuditLog = require("./audit-log.model");
const { isRegulatedTrade } = require("../../constants/trust");
const env = require("../../config/env");
const { templates } = require("../../utils/email");
const { notify } = require("../../utils/notify");

const listApplicationsSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const checklistSchema = z
  .object({
    idVerified: z.boolean().default(false),
    certificateVerified: z.boolean().default(false),
    insuranceConfirmed: z.boolean().default(false),
    linkedinVerified: z.boolean().default(false),
  })
  .default({});

const reviewSchema = z
  .object({
    decision: z.enum(["approved", "rejected"]),
    note: z.string().trim().max(1000).optional().default(""),
    checklist: checklistSchema,
  })
  .refine((data) => data.decision !== "rejected" || data.note.length >= 10, {
    message: "A rejection needs a reason (at least 10 characters). It is emailed to the expert.",
    path: ["note"],
  });

const offersOnsite = (profile) =>
  (profile.engagementTypes || []).includes("onsite") ||
  profile.engagementType === "onsite" ||
  profile.engagementType === "both";

/** Which checklist items must be ticked before this expert can be approved (PRD 4.4). */
const approvalRequirements = (profile) => ({
  idVerified: true,
  certificateVerified: isRegulatedTrade(profile),
  insuranceConfirmed: offersOnsite(profile),
  linkedinVerified: false, // recorded when checked, but not every expert has LinkedIn
});

const firstNameOf = (name) => (name || "").split(" ")[0] || "there";

const statusSchema = z.object({
  status: z.enum(["active", "suspended"]),
  note: z.string().trim().max(1000).optional().default(""),
});

// Only copy submission fields the applicant actually filled in, so empty defaults
// never overwrite data already on the expert profile
// Credentials live on the profile (the expert may have corrected them since applying),
// so the snapshot never overwrites them
const PROFILE_OWNED_FIELDS = new Set(["certifications", "engagementTypes", "insuranceDeclared", "linkedinUrl"]);

const filledSubmissionFields = (submission) => {
  const plain = submission?.toObject ? submission.toObject() : submission || {};
  return Object.fromEntries(
    Object.entries(plain).filter(([key, value]) => {
      if (PROFILE_OWNED_FIELDS.has(key)) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "string") return value.trim() !== "";
      if (typeof value === "number") return value > 0;
      return false;
    })
  );
};

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
      .populate(
        "expertProfileId",
        "fullName headline yearsExperience country city domain categories skills engagementTypes engagementType " +
          "linkedinUrl certifications insuranceDeclared resubmissionCount verificationChecklist"
      )
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
    expertProfileId: item.expertProfileId?._id?.toString?.() || "",
    expertProfile: item.expertProfileId || null,
    requirements: item.expertProfileId ? approvalRequirements(item.expertProfileId) : null,
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

  const { decision, note, checklist } = parsed.data;
  const profile = await ExpertProfile.findById(application.expertProfileId);
  if (!profile) {
    return sendError(res, "Expert profile not found", 404);
  }

  if (decision === "approved" && env.emailVerificationRequired) {
    const applicant = await User.findById(application.applicantUserId).select("emailVerifiedAt").lean();
    if (!applicant?.emailVerifiedAt) {
      return sendError(res, "This expert hasn't verified their email yet, so they can't be approved.", 400, {
        emailNotVerified: true,
      });
    }
  }

  if (decision === "approved") {
    const required = approvalRequirements(profile);
    const missing = Object.keys(required).filter((key) => required[key] && !checklist[key]);
    if (missing.length > 0) {
      return sendError(res, "Complete the verification checklist before approving", 400, { missing });
    }
  }

  const reviewedBy = req.auth.sub;
  const now = new Date();
  application.status = decision;
  application.review = { reviewedBy, reviewedAt: now, note };
  await application.save();

  profile.verificationChecklist = { ...checklist, checkedBy: reviewedBy, checkedAt: now };
  profile.approvalStatus = decision;
  if (decision === "approved") {
    Object.assign(profile, filledSubmissionFields(application.submission));
    profile.profileStatus = "active";
    profile.approvedAt = now;
    profile.rejectionReason = "";
    // The Verified badge and licence claims come only from this admin check
    profile.certifications.forEach((cert) => {
      cert.verified = checklist.certificateVerified;
    });
  } else {
    profile.profileStatus = "pending_review";
    profile.rejectionReason = note;
  }
  await profile.save();

  await User.findByIdAndUpdate(
    application.applicantUserId,
    { $set: { accountStatus: decision === "approved" ? "active" : "pending_review" } },
    { new: true }
  ).lean();

  await AuditLog.create({
    actorId: reviewedBy,
    action: "application_reviewed",
    entityType: "application",
    entityId: application._id.toString(),
    metadata: {
      decision,
      note,
      checklist,
      applicantUserId: application.applicantUserId.toString(),
    },
  });

  // Account decisions are always sent, whatever the notification switches say (PRD 5.2)
  const firstName = firstNameOf(profile.fullName);
  const approved = decision === "approved";
  await notify(application.applicantUserId, {
    kind: "account",
    push: {
      title: approved ? "Your profile is live on G(Old)" : "An update on your G(Old) application",
      body: approved
        ? "Our team has approved your profile. People can now request sessions with you."
        : "Our team has left a note about your application. Tap to read it.",
      data: { type: "application_reviewed", decision },
    },
    email: () =>
      approved
        ? templates.applicationApproved({ firstName })
        : templates.applicationRejected({ firstName, reason: note, canResubmit: profile.resubmissionCount < 1 }),
  });

  return sendSuccess(res, application, "Application reviewed");
};

/**
 * GET /admin/experts: every approved expert, including suspended ones, so the admin can
 * reactivate them (the public /experts list only shows active profiles).
 */
const listExpertsForAdmin = async (req, res) => {
  const items = await ExpertProfile.find({ approvalStatus: "approved", profileStatus: { $ne: "deleted" } })
    .select("userId fullName headline domain city country profileStatus founderBadge reviewCount recommendPercentage")
    .sort({ fullName: 1 })
    .lean();
  return sendSuccess(res, { items }, "Experts fetched");
};

const founderSchema = z.object({
  founderBadge: z.boolean(),
  note: z.string().trim().max(300).optional().default(""),
});

/** PRD 5.4: admin marks an approved expert as a Founding Expert (shown permanently on the profile) */
const setFounderBadge = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, "Invalid expert id", 400);
  }
  const parsed = founderSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid founder badge payload", 400, parsed.error.flatten());
  }

  const expert = await ExpertProfile.findById(req.params.id);
  if (!expert) {
    return sendError(res, "Expert not found", 404);
  }
  if (parsed.data.founderBadge && expert.approvalStatus !== "approved") {
    return sendError(res, "Only approved experts can be Founding Experts", 400);
  }

  expert.founderBadge = parsed.data.founderBadge;
  await expert.save();
  // Removing the badge is allowed to correct a mistake; the audit log keeps the history
  await AuditLog.create({
    actorId: req.auth.sub,
    action: "founder_badge_updated",
    entityType: "expert_profile",
    entityId: expert._id.toString(),
    metadata: { founderBadge: parsed.data.founderBadge, note: parsed.data.note, userId: expert.userId.toString() },
  });

  return sendSuccess(res, { expertId: expert._id, founderBadge: expert.founderBadge }, "Founding Expert badge updated");
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
  setFounderBadge,
  listExpertsForAdmin,
};
