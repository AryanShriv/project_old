const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerProfile",
      required: true,
      index: true,
    },
    projectTitle: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    budget: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;
