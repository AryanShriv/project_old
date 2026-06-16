const mongoose = require("mongoose");

const savedExpertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpertProfile",
      required: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

savedExpertSchema.index({ userId: 1, expertId: 1 }, { unique: true });

const SavedExpert = mongoose.model("SavedExpert", savedExpertSchema);

module.exports = SavedExpert;
