const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const Application = require("./application.model");
const ExpertProfile = require("../experts/expert.model");
const User = require("../users/user.model");
const AuditLog = require("../admin/audit-log.model");
const { isRegulatedTrade } = require("../../constants/trust");

const MAX_RESUBMISSIONS = 1;

/** True when the profile has at least one certificate with type, number and issuing body. */
const hasCompleteCertificate = (profile) =>
  (profile.certifications || []).some(
    (c) => c.type?.trim() && c.number?.trim() && (c.issuingBody || c.body || "").trim()
  );

const createApplicationSchema = z.object({
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(1000).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  categories: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  hourlyRate: z.number().min(0).optional(),
  yearsExperience: z.number().min(0).max(60).optional(),
  portfolio: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        description: z.string().trim().max(400).optional().default(""),
        link: z.string().trim().url().optional().default(""),
      })
    )
    .max(30)
    .optional(),
});

const createExpertApplication = async (req, res) => {
  const parsed = createApplicationSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return sendError(res, "Invalid application payload", 400, parsed.error.flatten());
  }

  const userId = req.auth.sub;
  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, "User not found", 404);
  }
  if (user.role !== "expert") {
    return sendError(res, "Only expert accounts can apply", 403);
  }

  const existingPending = await Application.findOne({ applicantUserId: userId, status: "pending" });
  if (existingPending) {
    return sendError(res, "Your profile is already with our team for review", 409);
  }

  const expertProfile = await ExpertProfile.findOne({ userId });
  if (!expertProfile) {
    return sendError(res, "Expert profile not found", 404);
  }
  if (expertProfile.approvalStatus === "approved") {
    return sendError(res, "Your profile is already approved", 400);
  }

  // PRD 4.4: a rejected expert can edit and resubmit once; a second rejection is final
  const isResubmission = expertProfile.approvalStatus === "rejected";
  if (isResubmission && expertProfile.resubmissionCount >= MAX_RESUBMISSIONS) {
    return sendError(res, "This application has already been resubmitted once and cannot be reviewed again", 403);
  }
  if (isRegulatedTrade(expertProfile) && !hasCompleteCertificate(expertProfile)) {
    return sendError(
      res,
      "Regulated trades need a certificate type, number and issuing body before review",
      400
    );
  }

  const submission = {
    fullName: user.profile?.fullName || expertProfile.fullName || "",
    headline: parsed.data.headline ?? expertProfile.headline ?? "",
    bio: parsed.data.bio ?? expertProfile.bio ?? "",
    skills: parsed.data.skills ?? expertProfile.skills ?? [],
    categories: parsed.data.categories ?? expertProfile.categories ?? [],
    hourlyRate: parsed.data.hourlyRate ?? expertProfile.hourlyRate ?? 0,
    yearsExperience: parsed.data.yearsExperience ?? expertProfile.yearsExperience ?? 0,
    portfolio: parsed.data.portfolio ?? expertProfile.portfolio ?? [],
    country: expertProfile.country,
    city: expertProfile.city,
    domain: expertProfile.domain,
    engagementTypes: expertProfile.engagementTypes,
    linkedinUrl: expertProfile.linkedinUrl,
    certifications: (expertProfile.certifications || []).map((c) => ({
      type: c.type,
      number: c.number,
      issuingBody: c.issuingBody || c.body,
    })),
    insuranceDeclared: expertProfile.insuranceDeclared,
  };

  const application = await Application.create({
    applicantUserId: userId,
    expertProfileId: expertProfile._id,
    status: "pending",
    submission,
    isResubmission,
  });

  user.accountStatus = "pending_review";
  await user.save();

  expertProfile.profileStatus = "pending_review";
  expertProfile.approvalStatus = "pending";
  expertProfile.rejectionReason = "";
  if (isResubmission) expertProfile.resubmissionCount += 1;
  await expertProfile.save();

  await AuditLog.create({
    actorId: userId,
    action: "application_submitted",
    entityType: "application",
    entityId: application._id.toString(),
    metadata: {
      applicantUserId: userId.toString(),
      expertProfileId: expertProfile._id.toString(),
      isResubmission,
    },
  });

  return sendSuccess(res, application, "Application submitted", 201);
};

module.exports = { createExpertApplication };
