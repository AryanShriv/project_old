const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const ExpertProfile = require("../experts/expert.model");

const signAccessToken = (user) => {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  });
};

const signRefreshToken = (user) => {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
};

const toAuthUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
  accountStatus: user.accountStatus,
  profile: user.profile,
  emailVerified: Boolean(user.emailVerifiedAt),
  // Whether this server enforces verification (only once emails can be delivered)
  emailVerificationRequired: env.emailVerificationRequired && user.role !== "admin",
});

const buildAuthUserPayload = async (user) => {
  const base = toAuthUser(user);
  if (user.role !== "expert") {
    return base;
  }
  const profile = await ExpertProfile.findOne({ userId: user._id }).select("_id approvalStatus rejectionReason resubmissionCount");
  return {
    ...base,
    managedExpertId: profile?._id?.toString(),
    approvalStatus: profile?.approvalStatus,
    rejectionReason: profile?.rejectionReason || "",
    resubmissionCount: profile?.resubmissionCount ?? 0,
  };
};

module.exports = { signAccessToken, signRefreshToken, toAuthUser, buildAuthUserPayload };
