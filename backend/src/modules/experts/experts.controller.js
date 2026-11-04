const mongoose = require("mongoose");
const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const ExpertProfile = require("./expert.model");
const User = require("../users/user.model");

// User input is matched literally, so "C++" searches for "C++" instead of being parsed as a pattern
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listSchema = z.object({
  q: z.string().trim().optional(),
  skill: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minRate: z.coerce.number().min(0).optional(),
  maxRate: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const updateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional(),
    headline: z.string().trim().max(120).optional(),
    bio: z.string().trim().max(1000).optional(),
    avatarUrl: z.string().trim().url().optional(),
    skills: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
    categories: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
    hourlyRate: z.number().min(0).optional(),
    currency: z.string().trim().min(3).max(6).optional(),
    yearsExperience: z.number().min(0).max(60).optional(),
    location: z.string().trim().max(120).optional(),
    responseTime: z.string().trim().max(80).optional(),
    isAvailable: z.boolean().optional(),
    experience: z.array(
      z.object({
        year: z.string().trim().min(1),
        role: z.string().trim().min(1),
        company: z.string().trim().min(1),
        description: z.string().trim().default(""),
      })
    ).optional(),
    portfolio: z.array(
      z.object({
        title: z.string().trim().min(1),
        description: z.string().trim().default(""),
        link: z.string().trim().url().or(z.string().length(0)).optional(),
      })
    ).optional(),
    // PRD 4.3 profile fields the expert can edit. Approval, badges and stats are admin/system only.
    domain: z.string().trim().max(60).optional(),
    country: z.enum(["Canada", "India"]).optional(),
    city: z.string().trim().max(80).optional(),
    languages: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
    linkedinUrl: z.string().trim().url().or(z.literal("")).optional(),
    pricingCAD: z.number().min(0).max(100000).optional(),
    pricingINR: z.number().min(0).max(10000000).optional(),
    engagementTypes: z.array(z.enum(["remote", "onsite"])).min(1).optional(),
    onsiteRadiusKm: z.number().min(0).max(500).optional(),
    certifications: z
      .array(
        z.object({
          type: z.string().trim().min(1).max(120),
          number: z.string().trim().min(1).max(60),
          issuingBody: z.string().trim().min(1).max(120),
        })
      )
      .max(10)
      .optional(),
    insuranceDeclared: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, { message: "At least one field is required" });

const listExperts = async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, "Invalid query parameters", 400, parsed.error.flatten());
  }

  const { q, skill, category, minRate, maxRate, page, limit } = parsed.data;

  const filter = { profileStatus: "active" };
  if (q) {
    filter.$text = { $search: q };
  }
  if (skill) {
    filter.skills = { $elemMatch: { $regex: new RegExp(escapeRegex(skill), "i") } };
  }
  if (category) {
    filter.categories = { $elemMatch: { $regex: new RegExp(escapeRegex(category), "i") } };
  }
  if (minRate !== undefined || maxRate !== undefined) {
    filter.hourlyRate = {};
    if (minRate !== undefined) filter.hourlyRate.$gte = minRate;
    if (maxRate !== undefined) filter.hourlyRate.$lte = maxRate;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    ExpertProfile.find(filter).select(ADMIN_ONLY_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ExpertProfile.countDocuments(filter),
  ]);

  return sendSuccess(res, { items, pagination: { page, limit, total } }, "Experts fetched");
};

// Internal review data that must never reach the public Discover or profile responses
const ADMIN_ONLY_FIELDS = "-adminNotes -rejectionReason -verificationChecklist";

const getExpertById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, "Invalid expert id", 400);
  }

  const expert = await ExpertProfile.findById(req.params.id).lean();
  if (!expert) {
    return sendError(res, "Expert not found", 404);
  }

  const requesterRole = req.auth?.role;
  const requesterUserId = req.auth?.sub;
  const isOwner = requesterUserId && expert.userId.toString() === requesterUserId;
  if (expert.profileStatus !== "active" && requesterRole !== "admin" && !isOwner) {
    return sendError(res, "Expert not available", 404);
  }

  if (requesterRole !== "admin" && !isOwner) {
    delete expert.adminNotes;
    delete expert.rejectionReason;
    delete expert.verificationChecklist;
  }

  return sendSuccess(res, expert, "Expert fetched");
};

const updateExpertById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, "Invalid expert id", 400);
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid update payload", 400, parsed.error.flatten());
  }

  const profile = await ExpertProfile.findById(req.params.id);
  if (!profile) {
    return sendError(res, "Expert not found", 404);
  }

  const requesterRole = req.auth?.role;
  const requesterUserId = req.auth?.sub;
  const isOwner = profile.userId.toString() === requesterUserId;
  if (requesterRole !== "admin" && !isOwner) {
    return sendError(res, "Forbidden", 403);
  }

  const { certifications, engagementTypes, onsiteRadiusKm, insuranceDeclared, ...rest } = parsed.data;
  Object.assign(profile, rest);

  if (engagementTypes) {
    profile.engagementTypes = engagementTypes;
    profile.engagementType =
      engagementTypes.length === 2 ? "both" : engagementTypes[0]; // legacy mirror
  }
  if (onsiteRadiusKm !== undefined) {
    profile.onsiteRadiusKm = onsiteRadiusKm;
    profile.availabilityRadius = onsiteRadiusKm; // legacy mirror
  }
  if ((profile.engagementTypes || []).includes("onsite") && profile.country && profile.country !== "Canada") {
    return sendError(res, "On-site sessions are only available in Canada", 400);
  }
  if (insuranceDeclared !== undefined && insuranceDeclared !== profile.insuranceDeclared) {
    profile.insuranceDeclared = insuranceDeclared;
    profile.insuranceDeclaredAt = insuranceDeclared ? new Date() : undefined;
  }
  if (certifications) {
    // Any edit to credentials needs a fresh admin check before the licence is shown as verified
    const unchanged = (a, b) => a.type === b.type && a.number === b.number && a.issuingBody === (b.issuingBody || b.body);
    profile.certifications = certifications.map((cert) => {
      const previous = profile.certifications.find((old) => unchanged(cert, old));
      return { ...cert, body: cert.issuingBody, verified: Boolean(previous?.verified) };
    });
  }
  await profile.save();

  if (parsed.data.fullName || parsed.data.avatarUrl || parsed.data.bio || parsed.data.headline) {
    const userProfileUpdate = {};
    if (parsed.data.fullName !== undefined) userProfileUpdate["profile.fullName"] = parsed.data.fullName;
    if (parsed.data.avatarUrl !== undefined) userProfileUpdate["profile.avatarUrl"] = parsed.data.avatarUrl;
    if (parsed.data.bio !== undefined) userProfileUpdate["profile.bio"] = parsed.data.bio;
    if (parsed.data.headline !== undefined) userProfileUpdate["profile.headline"] = parsed.data.headline;
    if (Object.keys(userProfileUpdate).length > 0) {
      await User.findByIdAndUpdate(profile.userId, { $set: userProfileUpdate });
    }
  }

  return sendSuccess(res, profile, "Expert updated");
};

module.exports = { listExperts, getExpertById, updateExpertById };
