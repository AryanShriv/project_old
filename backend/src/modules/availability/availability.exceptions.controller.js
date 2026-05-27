const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const AvailabilityException = require("./availability-exception.model");
const { assertFreelancerAccess } = require("./availability.access");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM format"),
});

const upsertExceptionSchema = z.object({
  kind: z.enum(["blocked", "custom"]),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  note: z.string().trim().max(200).optional(),
});

const listExceptions = async (req, res) => {
  const access = await assertFreelancerAccess(req.params.freelancerId, req.auth);
  if (!access.ok) {
    return sendError(res, access.message, access.status);
  }

  const parsed = monthQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, "Invalid month query", 400, parsed.error.flatten());
  }

  const [year, month] = parsed.data.month.split("-");
  const start = `${year}-${month}-01`;
  const end = `${year}-${month}-31`;

  const items = await AvailabilityException.find({
    freelancerId: req.params.freelancerId,
    date: { $gte: start, $lte: end },
  })
    .sort({ date: 1 })
    .lean();

  return sendSuccess(res, { items }, "Exceptions fetched");
};

const upsertException = async (req, res) => {
  const access = await assertFreelancerAccess(req.params.freelancerId, req.auth);
  if (!access.ok) {
    return sendError(res, access.message, access.status);
  }

  if (!dateRegex.test(req.params.date)) {
    return sendError(res, "Invalid date format. Use YYYY-MM-DD", 400);
  }

  const parsed = upsertExceptionSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid exception payload", 400, parsed.error.flatten());
  }

  if (parsed.data.kind === "custom") {
    if (!parsed.data.startTime || !parsed.data.endTime) {
      return sendError(res, "Custom exceptions require startTime and endTime", 400);
    }
    if (parsed.data.startTime >= parsed.data.endTime) {
      return sendError(res, "End time must be after start time", 400);
    }
  }

  const record = await AvailabilityException.findOneAndUpdate(
    { freelancerId: req.params.freelancerId, date: req.params.date },
    {
      $set: {
        freelancerId: req.params.freelancerId,
        date: req.params.date,
        kind: parsed.data.kind,
        startTime: parsed.data.startTime || "",
        endTime: parsed.data.endTime || "",
        note: parsed.data.note || "",
      },
    },
    { upsert: true, new: true }
  );

  return sendSuccess(res, record, "Exception saved");
};

const deleteException = async (req, res) => {
  const access = await assertFreelancerAccess(req.params.freelancerId, req.auth);
  if (!access.ok) {
    return sendError(res, access.message, access.status);
  }

  if (!dateRegex.test(req.params.date)) {
    return sendError(res, "Invalid date format. Use YYYY-MM-DD", 400);
  }

  const removed = await AvailabilityException.findOneAndDelete({
    freelancerId: req.params.freelancerId,
    date: req.params.date,
  });

  if (!removed) {
    return sendError(res, "Exception not found", 404);
  }

  return sendSuccess(res, { date: req.params.date }, "Exception removed");
};

module.exports = { listExceptions, upsertException, deleteException };
