const mongoose = require("mongoose");

const freelancerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    fullName: { type: String, trim: true, required: true },
    headline: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    avatarUrl: { type: String, trim: true, default: "" },
    skills: [{ type: String, trim: true }],
    categories: [{ type: String, trim: true }],
    hourlyRate: { type: Number, min: 0, default: 0, index: true },
    currency: { type: String, trim: true, default: "USD" },
    yearsExperience: { type: Number, min: 0, default: 0 },
    location: { type: String, trim: true, default: "" },
    responseTime: { type: String, trim: true, default: "" },
    isAvailable: { type: Boolean, default: true, index: true },
    profileStatus: {
      type: String,
      enum: ["active", "pending_review", "suspended"],
      default: "pending_review",
      index: true,
    },
    portfolio: [{ title: String, description: String, link: String }],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    completedProjects: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

freelancerSchema.index({ fullName: "text", headline: "text", skills: "text", categories: "text" });

const FreelancerProfile = mongoose.model("FreelancerProfile", freelancerSchema);

module.exports = FreelancerProfile;
