const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpertProfile",
      required: true,
      index: true,
    },
    
    // Legacy fields (keep for backward compatibility)
    projectTitle: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    budget: { type: Number, min: 0, default: 0 },
    
    // New G(Old) fields
    userMessage: { type: String, trim: true, default: "" }, // Original user message
    aiSummary: { type: String, trim: true, default: "" }, // AI translated version
    engagementType: { 
      type: String, 
      enum: ["remote", "onsite", "both", "ongoing"], 
      default: "remote" 
    },
    timingPreference: { 
      type: String, 
      enum: ["asap", "week", "month", "flexible", "this_week", "this_month"], 
      default: "flexible" 
    },
    
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed", "expired"],
      default: "pending",
      index: true,
    },
    
    // Auto-expiry (48hr)
    expiresAt: { type: Date, index: true },
    respondedAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

// Set expiry to 48 hours from creation if not set
requestSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
  }
  next();
});

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;
