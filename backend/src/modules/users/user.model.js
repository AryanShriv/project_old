const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    headline: { type: String, trim: true, default: "" },
    avatarUrl: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "expert", "admin"], default: "user", index: true },
    accountStatus: {
      type: String,
      enum: ["active", "pending_review", "suspended", "deleted"],
      default: "active",
      index: true,
    },
    profile: { type: profileSchema, default: () => ({}) },
    refreshTokenHash: { type: String, default: null },
    pushTokens: { type: [String], default: [] },
    // Email verification. Accounts created before this existed are marked verified on server start
    // (migrations/email-verified-backfill.js).
    emailVerifiedAt: { type: Date, default: null },
    // Six-digit email codes, stored hashed (modules/auth/auth.codes.js)
    emailVerification: {
      codeHash: String,
      expiresAt: Date,
      attempts: Number,
      sentAt: Date,
    },
    passwordReset: {
      codeHash: String,
      expiresAt: Date,
      attempts: Number,
      sentAt: Date,
    },
    // Set when the person deletes their account; personal details are erased at the same time
    deletedAt: { type: Date, default: null },
    // The switches on the app's Notifications screen. They apply to push and email alike.
    // Account decisions (application approved/rejected) are always sent. (PRD 5.2)
    notificationPrefs: {
      requestUpdates: { type: Boolean, default: true }, // requests, their outcome, review prompts
      newMessages: { type: Boolean, default: true },
      appUpdates: { type: Boolean, default: false },
    },
    // What the person agreed to at signup, and when (PRD 4.5)
    legalAcceptance: {
      termsVersion: { type: String, default: "" },
      termsAcceptedAt: { type: Date, default: null },
      // Experts
      expertComplianceAcceptedAt: { type: Date, default: null }, // credentials declaration
      independentContractorAcceptedAt: { type: Date, default: null },
      insuranceAcknowledgedAt: { type: Date, default: null },
      // Users
      platformOnlyAcknowledgedAt: { type: Date, default: null },
      onsiteSafetyAcknowledgedAt: { type: Date, default: null },
    },
  },
  { timestamps: true, versionKey: false }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
