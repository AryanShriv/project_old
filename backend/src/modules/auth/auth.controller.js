const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../users/user.model");
const FreelancerProfile = require("../freelancers/freelancer.model");
const env = require("../../config/env");
const { sendSuccess, sendError } = require("../../utils/http");
const { signAccessToken, signRefreshToken, toAuthUser } = require("./auth.utils");

const registerSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(6),
    fullName: z.string().trim().min(2).max(100),
    role: z.enum(["client", "freelancer"]).optional(),
    acceptedTerms: z.boolean(),
    acceptedFreelancerCompliance: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.acceptedTerms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You must accept the Terms and Conditions to register.",
        path: ["acceptedTerms"],
      });
    }
    if (data.role === "freelancer" && !data.acceptedFreelancerCompliance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You must confirm your professional credentials declaration.",
        path: ["acceptedFreelancerCompliance"],
      });
    }
  });

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const buildAuthUserPayload = async (user) => {
  const base = toAuthUser(user);
  if (user.role !== "freelancer") {
    return base;
  }
  const profile = await FreelancerProfile.findOne({ userId: user._id }).select("_id");
  return {
    ...base,
    managedFreelancerId: profile?._id?.toString(),
  };
};

const register = async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid register payload", 400, parsed.error.flatten());
  }

  const { email, password, fullName, role = "client" } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) {
    return sendError(res, "Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const accountStatus = role === "freelancer" ? "pending_review" : "active";
  const acceptedAt = new Date();
  const user = await User.create({
    email,
    passwordHash,
    role,
    accountStatus,
    profile: { fullName },
    legalAcceptance: {
      termsAcceptedAt: acceptedAt,
      freelancerComplianceAcceptedAt: role === "freelancer" ? acceptedAt : null,
    },
  });

  if (role === "freelancer") {
    await FreelancerProfile.create({
      userId: user._id,
      fullName,
      headline: "",
      bio: "",
      profileStatus: "pending_review",
    });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await user.save();

  const authUser = await buildAuthUserPayload(user);

  return sendSuccess(
    res,
    {
      accessToken,
      refreshToken,
      user: authUser,
    },
    "Registered successfully",
    201
  );
};

const login = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid login payload", 400, parsed.error.flatten());
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user) {
    return sendError(res, "Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return sendError(res, "Invalid credentials", 401);
  }

  if (user.accountStatus === "suspended") {
    return sendError(res, "Account is suspended", 403);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await user.save();

  const authUser = await buildAuthUserPayload(user);
  return sendSuccess(res, { accessToken, refreshToken, user: authUser }, "Login successful");
};

const refresh = async (req, res) => {
  const refreshToken = req.body?.refreshToken;
  if (!refreshToken) {
    return sendError(res, "refreshToken is required", 400);
  }

  try {
    const payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
    const user = await User.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      return sendError(res, "Invalid refresh token", 401);
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenMatch) {
      return sendError(res, "Invalid refresh token", 401);
    }

    if (user.accountStatus === "suspended") {
      return sendError(res, "Account is suspended", 403);
    }

    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
    await user.save();

    const authUser = await buildAuthUserPayload(user);
    return sendSuccess(
      res,
      { accessToken, refreshToken: newRefreshToken, user: authUser },
      "Token refreshed"
    );
  } catch (error) {
    return sendError(res, "Invalid or expired refresh token", 401);
  }
};

const logout = async (req, res) => {
  const userId = req.auth?.sub;
  if (!userId) {
    return sendError(res, "Unauthorized", 401);
  }

  await User.findByIdAndUpdate(userId, { $set: { refreshTokenHash: null } });
  return sendSuccess(res, null, "Logged out");
};

const me = async (req, res) => {
  const userId = req.auth?.sub;
  if (!userId) {
    return sendError(res, "Unauthorized", 401);
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, "Unauthorized – user no longer exists", 401);
  }

  if (user.accountStatus === "suspended") {
    return sendError(res, "Account is suspended", 403);
  }

  const authUser = await buildAuthUserPayload(user);
  return sendSuccess(res, { user: authUser }, "Authenticated");
};

module.exports = { register, login, refresh, logout, me };
