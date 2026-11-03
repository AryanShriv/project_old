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
    
    // Request a Session fields (PRD 3.5). New code reads and writes these.
    headline: { type: String, trim: true, default: "" }, // "What do you need help with?"
    description: { type: String, trim: true, default: "" }, // "Tell us more about your situation"
    sessionType: {
      type: String,
      enum: ["remote", "onsite", "ongoing"],
      default: "remote",
    },

    // Legacy fields, still dual-written so older app builds keep working.
    // projectTitle mirrors headline, userMessage mirrors description,
    // engagementType mirrors sessionType. Backfill: migrations/request-fields-backfill.js
    projectTitle: { type: String, trim: true, required: true },
    userMessage: { type: String, trim: true, default: "" },
    engagementType: {
      type: String,
      enum: ["remote", "onsite", "both", "ongoing"],
      default: "remote"
    },
    // Deprecated: experts set their own rates. No longer accepted by the API; kept only for existing documents.
    budget: { type: Number, min: 0, default: 0 },

    aiSummary: { type: String, trim: true, default: "" }, // Hook for a future AI problem translator
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
    completedAt: { type: Date },
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
