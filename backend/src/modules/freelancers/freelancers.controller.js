const mongoose = require("mongoose");
const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const FreelancerProfile = require("./freelancer.model");
const User = require("../users/user.model");

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
  })
  .refine((payload) => Object.keys(payload).length > 0, { message: "At least one field is required" });

const listFreelancers = async (req, res) => {
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
    filter.skills = { $elemMatch: { $regex: new RegExp(skill, "i") } };
  }
  if (category) {
    filter.categories = { $elemMatch: { $regex: new RegExp(category, "i") } };
  }
  if (minRate !== undefined || maxRate !== undefined) {
    filter.hourlyRate = {};
    if (minRate !== undefined) filter.hourlyRate.$gte = minRate;
    if (maxRate !== undefined) filter.hourlyRate.$lte = maxRate;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    FreelancerProfile.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    FreelancerProfile.countDocuments(filter),
  ]);

  return sendSuccess(res, { items, pagination: { page, limit, total } }, "Freelancers fetched");
};

const getFreelancerById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, "Invalid freelancer id", 400);
  }

  const freelancer = await FreelancerProfile.findById(req.params.id).lean();
  if (!freelancer) {
    return sendError(res, "Freelancer not found", 404);
  }

  const requesterRole = req.auth?.role;
  const requesterUserId = req.auth?.sub;
  const isOwner = requesterUserId && freelancer.userId.toString() === requesterUserId;
  if (freelancer.profileStatus !== "active" && requesterRole !== "admin" && !isOwner) {
    return sendError(res, "Freelancer not available", 404);
  }

  return sendSuccess(res, freelancer, "Freelancer fetched");
};

const updateFreelancerById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, "Invalid freelancer id", 400);
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid update payload", 400, parsed.error.flatten());
  }

  const profile = await FreelancerProfile.findById(req.params.id);
  if (!profile) {
    return sendError(res, "Freelancer not found", 404);
  }

  const requesterRole = req.auth?.role;
  const requesterUserId = req.auth?.sub;
  const isOwner = profile.userId.toString() === requesterUserId;
  if (requesterRole !== "admin" && !isOwner) {
    return sendError(res, "Forbidden", 403);
  }

  Object.assign(profile, parsed.data);
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

  return sendSuccess(res, profile, "Freelancer updated");
};

module.exports = { listFreelancers, getFreelancerById, updateFreelancerById };
