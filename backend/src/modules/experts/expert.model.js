const mongoose = require("mongoose");

const expertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    // Basic info
    fullName: { type: String, trim: true, required: true },
    headline: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    avatarUrl: { type: String, trim: true, default: "" },

    // Skills & categories
    skills: [{ type: String, trim: true }],
    categories: [{ type: String, trim: true }],

    // Pricing (legacy + new dual pricing)
    hourlyRate: { type: Number, min: 0, default: 0, index: true },
    currency: { type: String, trim: true, default: "USD" },
    pricingCAD: { type: Number, min: 0, default: 0 },
    pricingINR: { type: Number, min: 0, default: 0 },

    // Experience & trust signals
    yearsExperience: { type: Number, min: 0, default: 0 },
    domain: { type: String, trim: true, default: "" }, // Finance/Trades/Tech/etc

    // Location & availability
    location: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    // PRD 4.3: one entry per session mode the expert offers. On-site is Canada only.
    engagementTypes: [{ type: String, enum: ["remote", "onsite"] }],
    onsiteRadiusKm: { type: Number, min: 0, default: 0 },
    // Legacy mirrors of engagementTypes / onsiteRadiusKm, still written for older app builds
    engagementType: {
      type: String,
      enum: ["remote", "onsite", "both"],
      default: "remote"
    },
    availabilityRadius: { type: Number, min: 0, default: 0 }, // km for onsite

    // Professional details
    linkedinUrl: { type: String, trim: true, default: "" },
    languages: [{ type: String, trim: true }],
    responseTime: { type: String, trim: true, default: "" },

    // Certifications (critical for Canada trades)
    certifications: [{
      type: { type: String, trim: true }, // Licence type, e.g. "309A Construction and Maintenance Electrician"
      number: { type: String, trim: true }, // Licence number
      issuingBody: { type: String, trim: true }, // e.g. "Skilled Trades Ontario"
      body: { type: String, trim: true }, // Legacy name for issuingBody, still written
      verified: { type: Boolean, default: false }, // Set by admin after checking the licence
    }],
    // Expert declares they hold liability insurance for on-site work
    insuranceDeclared: { type: Boolean, default: false },
    insuranceDeclaredAt: { type: Date },

    // Status & availability
    isAvailable: { type: Boolean, default: true, index: true },
    profileStatus: {
      type: String,
      enum: ["active", "pending_review", "suspended"],
      default: "pending_review",
      index: true,
    },

    // Admin approval workflow
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, trim: true, default: "" },
    approvedAt: { type: Date },
    adminNotes: { type: String, trim: true, default: "" },
    // Admin approval checklist (PRD 4.4). Internal: never sent in public responses.
    verificationChecklist: {
      idVerified: { type: Boolean, default: false },
      certificateVerified: { type: Boolean, default: false },
      insuranceConfirmed: { type: Boolean, default: false },
      linkedinVerified: { type: Boolean, default: false },
      checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      checkedAt: { type: Date, default: null },
    },
    // A rejected expert may edit and resubmit once; a second rejection is final
    resubmissionCount: { type: Number, min: 0, default: 0 },
    founderBadge: { type: Boolean, default: false }, // Founding Expert (PRD 5.4)

    // Portfolio & experience
    portfolio: [{ title: String, description: String, link: String }],
    experience: [{ year: String, role: String, company: String, description: String }],

    // Stats: recalculated from visible reviews by reviews.stats.js, never incremented by hand
    recommendedCount: { type: Number, min: 0, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    recommendPercentage: { type: Number, min: 0, max: 100, default: null }, // null until the first review
    styleBreakdown: {
      structured: { type: Number, min: 0, default: 0 },
      conversational: { type: Number, min: 0, default: 0 },
      hands_on: { type: Number, min: 0, default: 0 },
    },
    completedProjects: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

expertSchema.index({ fullName: "text", headline: "text", skills: "text", categories: "text" });

const ExpertProfile = mongoose.model("ExpertProfile", expertSchema);

module.exports = ExpertProfile;
