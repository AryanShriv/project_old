const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicantUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    freelancerProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerProfile",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    submission: {
      fullName: { type: String, trim: true, default: "" },
      headline: { type: String, trim: true, default: "" },
      bio: { type: String, trim: true, default: "" },
      skills: [{ type: String, trim: true }],
      categories: [{ type: String, trim: true }],
      hourlyRate: { type: Number, min: 0, default: 0 },
      yearsExperience: { type: Number, min: 0, default: 0 },
      portfolio: [{ title: String, description: String, link: String }],
    },
    review: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      reviewedAt: { type: Date, default: null },
      note: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true, versionKey: false }
);

applicationSchema.index({ applicantUserId: 1, status: 1 });

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
