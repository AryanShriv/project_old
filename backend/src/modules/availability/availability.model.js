const mongoose = require("mongoose");

const daySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      required: true,
    },
    enabled: { type: Boolean, default: false },
    startTime: { type: String, trim: true, default: "09:00" },
    endTime: { type: String, trim: true, default: "17:00" },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerProfile",
      required: true,
      unique: true,
      index: true,
    },
    timezone: { type: String, trim: true, default: "UTC" },
    slots: { type: [daySlotSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

const Availability = mongoose.model("Availability", availabilitySchema);

module.exports = Availability;
