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
      type: { type: String, trim: true }, // License type
      number: { type: String, trim: true }, // License number
      body: { type: String, trim: true }, // Issuing body
      verified: { type: Boolean, default: false }
    }],
    
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
    
    // Portfolio & experience
    portfolio: [{ title: String, description: String, link: String }],
    experience: [{ year: String, role: String, company: String, description: String }],
    
    // Stats
    recommendedCount: { type: Number, min: 0, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    completedProjects: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

expertSchema.index({ fullName: "text", headline: "text", skills: "text", categories: "text" });

const ExpertProfile = mongoose.model("ExpertProfile", expertSchema);

module.exports = ExpertProfile;
