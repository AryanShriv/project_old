const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const Availability = require("./availability.model");
const { defaultSlots } = require("./availability.defaults");
const { assertFreelancerAccess } = require("./availability.access");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const slotSchema = z.object({
  day: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  enabled: z.boolean(),
  startTime: z.string().regex(timeRegex, "Use HH:MM format"),
  endTime: z.string().regex(timeRegex, "Use HH:MM format"),
});

const upsertSchema = z.object({
  timezone: z.string().trim().min(1).max(80).optional(),
  slots: z.array(slotSchema).length(7),
});

const getAvailability = async (req, res) => {
  const access = await assertFreelancerAccess(req.params.freelancerId, req.auth);
  if (!access.ok) {
    return sendError(res, access.message, access.status);
  }

  let record = await Availability.findOne({ freelancerId: req.params.freelancerId }).lean();
  if (!record) {
    record = {
      freelancerId: req.params.freelancerId,
      timezone: "UTC",
      slots: defaultSlots(),
    };
  }

  return sendSuccess(res, record, "Availability fetched");
};

const upsertAvailability = async (req, res) => {
  const access = await assertFreelancerAccess(req.params.freelancerId, req.auth);
  if (!access.ok) {
    return sendError(res, access.message, access.status);
  }

  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid availability payload", 400, parsed.error.flatten());
  }

  for (const slot of parsed.data.slots) {
    if (slot.enabled && slot.startTime >= slot.endTime) {
      return sendError(res, `End time must be after start time for ${slot.day}`, 400);
    }
  }

  const record = await Availability.findOneAndUpdate(
    { freelancerId: req.params.freelancerId },
    {
      $set: {
        freelancerId: req.params.freelancerId,
        timezone: parsed.data.timezone || "UTC",
        slots: parsed.data.slots,
      },
    },
    { upsert: true, new: true }
  );

  return sendSuccess(res, record, "Availability updated");
};

module.exports = { getAvailability, upsertAvailability };
