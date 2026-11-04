const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../users/user.model");
const FreelancerProfile = require("../experts/expert.model");
const Application = require("../applications/application.model");
const env = require("../../config/env");
const { sendSuccess, sendError } = require("../../utils/http");
const { signAccessToken, signRefreshToken, buildAuthUserPayload } = require("./auth.utils");
const { TERMS_VERSION, REGULATED_CATEGORIES, isRegulatedTrade } = require("../../constants/trust");

const expertProfileSchema = z.object({
  country: z.enum(["Canada", "India"]),
  city: z.string().trim().min(2).max(80),
  domain: z.string().trim().min(2).max(60), // one category from the G(Old) taxonomy
  engagementTypes: z.array(z.enum(["remote", "onsite"])).min(1),
  linkedinUrl: z.string().trim().url().or(z.literal("")).optional().default(""),
  certification: z
    .object({
      type: z.string().trim().max(120).default(""),
      number: z.string().trim().max(60).default(""),
      issuingBody: z.string().trim().max(120).default(""),
    })
    .optional(),
  insuranceDeclared: z.boolean().optional().default(false),
});

// Each acknowledgement must be explicitly true; it is stored with a timestamp (PRD 4.5)
const mustAccept = (data, ctx, field, message) => {
  if (data[field] !== true) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [field] });
  }
};

const registerSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(6),
    fullName: z.string().trim().min(2).max(100),
    role: z.enum(["user", "expert"]).optional().default("user"),
    termsVersion: z.string().trim(),
    acceptedTerms: z.boolean(),
    // Users
    acknowledgedPlatformOnly: z.boolean().optional(),
    acknowledgedOnsiteSafety: z.boolean().optional(),
    // Experts
    acceptedExpertCompliance: z.boolean().optional(),
    acknowledgedIndependentContractor: z.boolean().optional(),
    acknowledgedInsurance: z.boolean().optional(),
    expertProfile: expertProfileSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.termsVersion !== TERMS_VERSION) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Our Terms have been updated. Please update the app and accept the latest version.",
        path: ["termsVersion"],
      });
    }
    mustAccept(data, ctx, "acceptedTerms", "You must accept the Terms and Conditions to register.");

    if (data.role === "user") {
      mustAccept(data, ctx, "acknowledgedPlatformOnly", "Please acknowledge that G(Old) is a platform only.");
      mustAccept(data, ctx, "acknowledgedOnsiteSafety", "Please acknowledge the on-site safety terms.");
      return;
    }

    mustAccept(data, ctx, "acceptedExpertCompliance", "You must confirm your professional credentials declaration.");
    mustAccept(data, ctx, "acknowledgedIndependentContractor", "Please confirm you are an independent contractor.");
    mustAccept(data, ctx, "acknowledgedInsurance", "Please acknowledge the insurance terms for on-site work.");

    const profile = data.expertProfile;
    if (!profile) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tell us about your expertise.", path: ["expertProfile"] });
      return;
    }
    const onsite = profile.engagementTypes.includes("onsite");
    if (onsite && profile.country !== "Canada") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "On-site sessions are only available in Canada.",
        path: ["expertProfile", "engagementTypes"],
      });
    }
    if (onsite && !profile.insuranceDeclared) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "On-site work requires you to declare that you hold liability insurance.",
        path: ["expertProfile", "insuranceDeclared"],
      });
    }
    if (isRegulatedTrade({ domain: profile.domain })) {
      const cert = profile.certification || {};
      if (!cert.type || !cert.number || !cert.issuingBody) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${REGULATED_CATEGORIES.join(", ")} are regulated trades: certificate type, number and issuing body are required.`,
          path: ["expertProfile", "certification"],
        });
      }
    }
  });

// Legacy single-value mirror of engagementTypes for older app builds
const toLegacyEngagementType = (types) =>
  types.includes("remote") && types.includes("onsite") ? "both" : types.includes("onsite") ? "onsite" : "remote";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const register = async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message;
    return sendError(res, firstIssue || "Invalid register payload", 400, parsed.error.flatten());
  }

  const { email, password, fullName, role, termsVersion } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) {
    return sendError(res, "Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const accountStatus = role === "expert" ? "pending_review" : "active";
  const acceptedAt = new Date();
  const user = await User.create({
    email,
    passwordHash,
    role,
    accountStatus,
    profile: { fullName },
    legalAcceptance: {
      termsVersion,
      termsAcceptedAt: acceptedAt,
      expertComplianceAcceptedAt: role === "expert" ? acceptedAt : null,
      independentContractorAcceptedAt: role === "expert" ? acceptedAt : null,
      insuranceAcknowledgedAt: role === "expert" ? acceptedAt : null,
      platformOnlyAcknowledgedAt: role === "user" ? acceptedAt : null,
      onsiteSafetyAcknowledgedAt: role === "user" ? acceptedAt : null,
    },
  });

  if (role === "expert") {
    const details = parsed.data.expertProfile;
    const cert = details.certification;
    const certifications =
      cert && cert.type && cert.number && cert.issuingBody
        ? [{ type: cert.type, number: cert.number, issuingBody: cert.issuingBody, body: cert.issuingBody, verified: false }]
        : [];
    const onsite = details.engagementTypes.includes("onsite");

    const profile = await FreelancerProfile.create({
      userId: user._id,
      fullName,
      headline: "",
      bio: "",
      country: details.country,
      city: details.city,
      location: `${details.city}, ${details.country}`,
      domain: details.domain,
      categories: [details.domain],
      engagementTypes: details.engagementTypes,
      engagementType: toLegacyEngagementType(details.engagementTypes),
      linkedinUrl: details.linkedinUrl,
      certifications,
      insuranceDeclared: onsite && details.insuranceDeclared,
      insuranceDeclaredAt: onsite && details.insuranceDeclared ? acceptedAt : undefined,
      profileStatus: "pending_review",
      approvalStatus: "pending",
    });

    await Application.create({
      applicantUserId: user._id,
      expertProfileId: profile._id,
      status: "pending",
      submission: {
        fullName,
        country: details.country,
        city: details.city,
        domain: details.domain,
        categories: [details.domain],
        engagementTypes: details.engagementTypes,
        linkedinUrl: details.linkedinUrl,
        certifications: certifications.map(({ type, number, issuingBody }) => ({ type, number, issuingBody })),
        insuranceDeclared: onsite && details.insuranceDeclared,
      },
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
    return sendError(res, "Your account is paused right now. Please contact support and we will help you sort it out.", 403);
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
      return sendError(res, "Your account is paused right now. Please contact support and we will help you sort it out.", 403);
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
    return sendError(res, "Your account is paused right now. Please contact support and we will help you sort it out.", 403);
  }

  const authUser = await buildAuthUserPayload(user);
  return sendSuccess(res, { user: authUser }, "Authenticated");
};

module.exports = { register, login, refresh, logout, me };
