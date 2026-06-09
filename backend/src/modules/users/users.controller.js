const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const User = require("./user.model");
const { toAuthUser } = require("../auth/auth.utils");

const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional(),
    bio: z.string().trim().max(500).optional(),
    headline: z.string().trim().max(120).optional(),
    avatarUrl: z.string().trim().url().optional(),
    company: z.string().trim().max(100).optional(),
    website: z.string().trim().max(200).optional(),
    location: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(20).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

const getMe = async (req, res) => {
  const userId = req.auth?.sub;
  const user = await User.findById(userId).select("-passwordHash -refreshTokenHash");
  if (!user) {
    return sendError(res, "User not found", 404);
  }

  return sendSuccess(res, toAuthUser(user), "Current user");
};

const updateMe = async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid profile payload", 400, parsed.error.flatten());
  }

  const userId = req.auth?.sub;
  const updatePayload = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    updatePayload[`profile.${key}`] = value;
  }

  const user = await User.findByIdAndUpdate(userId, { $set: updatePayload }, { new: true }).select(
    "-passwordHash -refreshTokenHash"
  );

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  return sendSuccess(res, toAuthUser(user), "Profile updated");
};

module.exports = { getMe, updateMe };

