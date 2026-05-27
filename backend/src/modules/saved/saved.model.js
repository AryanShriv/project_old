const mongoose = require("mongoose");

const savedFreelancerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerProfile",
      required: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

savedFreelancerSchema.index({ userId: 1, freelancerId: 1 }, { unique: true });

const SavedFreelancer = mongoose.model("SavedFreelancer", savedFreelancerSchema);

module.exports = SavedFreelancer;
