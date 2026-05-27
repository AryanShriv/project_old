const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const Application = require("./application.model");
const FreelancerProfile = require("../freelancers/freelancer.model");
const User = require("../users/user.model");
const AuditLog = require("../admin/audit-log.model");

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

const createFreelancerApplication = async (req, res) => {
  const parsed = createApplicationSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return sendError(res, "Invalid application payload", 400, parsed.error.flatten());
  }

  const userId = req.auth.sub;
  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, "User not found", 404);
  }
  if (user.role !== "freelancer") {
    return sendError(res, "Only freelancer accounts can apply", 403);
  }

  const existingPending = await Application.findOne({ applicantUserId: userId, status: "pending" });
  if (existingPending) {
    return sendError(res, "Pending application already exists", 409);
  }

  const freelancerProfile = await FreelancerProfile.findOne({ userId });
  if (!freelancerProfile) {
    return sendError(res, "Freelancer profile not found", 404);
  }

  const submission = {
    fullName: user.profile?.fullName || freelancerProfile.fullName || "",
    headline: parsed.data.headline ?? freelancerProfile.headline ?? "",
    bio: parsed.data.bio ?? freelancerProfile.bio ?? "",
    skills: parsed.data.skills ?? freelancerProfile.skills ?? [],
    categories: parsed.data.categories ?? freelancerProfile.categories ?? [],
    hourlyRate: parsed.data.hourlyRate ?? freelancerProfile.hourlyRate ?? 0,
    yearsExperience: parsed.data.yearsExperience ?? freelancerProfile.yearsExperience ?? 0,
    portfolio: parsed.data.portfolio ?? freelancerProfile.portfolio ?? [],
  };

  const application = await Application.create({
    applicantUserId: userId,
    freelancerProfileId: freelancerProfile._id,
    status: "pending",
    submission,
  });

  user.accountStatus = "pending_review";
  await user.save();

  freelancerProfile.profileStatus = "pending_review";
  await freelancerProfile.save();

  await AuditLog.create({
    actorId: userId,
    action: "application_submitted",
    entityType: "application",
    entityId: application._id.toString(),
    metadata: {
      applicantUserId: userId.toString(),
      freelancerProfileId: freelancerProfile._id.toString(),
    },
  });

  return sendSuccess(res, application, "Application submitted", 201);
};

module.exports = { createFreelancerApplication };
