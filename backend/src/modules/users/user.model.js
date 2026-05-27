const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    headline: { type: String, trim: true, default: "" },
    avatarUrl: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["client", "freelancer", "admin"], default: "client", index: true },
    accountStatus: {
      type: String,
      enum: ["active", "pending_review", "suspended"],
      default: "active",
      index: true,
    },
    profile: { type: profileSchema, default: () => ({}) },
    refreshTokenHash: { type: String, default: null },
    pushTokens: { type: [String], default: [] },
    legalAcceptance: {
      termsAcceptedAt: { type: Date, default: null },
      freelancerComplianceAcceptedAt: { type: Date, default: null },
    },
  },
  { timestamps: true, versionKey: false }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
