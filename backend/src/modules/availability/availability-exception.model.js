const mongoose = require("mongoose");

const availabilityExceptionSchema = new mongoose.Schema(
  {
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerProfile",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    kind: {
      type: String,
      enum: ["blocked", "custom"],
      default: "blocked",
    },
    startTime: { type: String, trim: true, default: "" },
    endTime: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true, versionKey: false }
);

availabilityExceptionSchema.index({ freelancerId: 1, date: 1 }, { unique: true });

const AvailabilityException = mongoose.model("AvailabilityException", availabilityExceptionSchema);

module.exports = AvailabilityException;
