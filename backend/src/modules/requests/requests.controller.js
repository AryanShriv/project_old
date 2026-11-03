const mongoose = require("mongoose");
const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const Request = require("./request.model");
const ExpertProfile = require("../experts/expert.model");
const { expireRequest } = require("./requests.expiry");

// PRD 3.5 payload: expertId, headline, description, sessionType, timingPreference.
// projectTitle / userMessage / engagementType are still accepted from older app builds.
// Unknown keys (including the removed `budget`) are stripped by zod.
const createSchema = z
  .object({
    expertId: z.string().trim().min(1),
    headline: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().min(50).max(500).optional(),
    sessionType: z.enum(["remote", "onsite", "ongoing"]).optional(),
    timingPreference: z.enum(["asap", "week", "month", "flexible"]).optional(),

    projectTitle: z.string().trim().min(3).max(160).optional(),
    userMessage: z.string().trim().min(10).max(500).optional(),
    engagementType: z.enum(["remote", "onsite", "both", "ongoing"]).optional(),
  })
  .refine((data) => data.headline || data.projectTitle || data.userMessage, {
    message: "headline is required",
    path: ["headline"],
  });

const toSessionType = (engagementType) =>
  engagementType === "onsite" || engagementType === "ongoing" ? engagementType : "remote";

const listSchema = z.object({
  role: z.enum(["user", "expert"]).optional(),
  status: z.enum(["pending", "accepted", "rejected", "cancelled", "completed", "expired"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const statusUpdateSchema = z.object({
  status: z.enum(["accepted", "rejected", "cancelled", "completed"]),
});

// Allowed status changes per role: current status -> statuses it may move to
const ALLOWED_TRANSITIONS = {
  user: { pending: ["cancelled"] },
  expert: { pending: ["accepted", "rejected"], accepted: ["completed"] },
  admin: { pending: ["accepted", "rejected", "cancelled"], accepted: ["completed", "cancelled"] },
};

const createRequest = async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid request payload", 400, parsed.error.flatten());
  }

  const data = parsed.data;
  const { expertId, timingPreference = "flexible" } = data;
  const headline = data.headline || data.projectTitle || data.userMessage.substring(0, 100);
  const description = data.description || data.userMessage || "";
  const sessionType = data.sessionType || toSessionType(data.engagementType);

  if (!mongoose.isValidObjectId(expertId)) {
    return sendError(res, "Invalid expertId", 400);
  }

  const expert = await ExpertProfile.findById(expertId).select("_id profileStatus country");
  if (!expert) {
    return sendError(res, "Expert not found", 404);
  }
  if (expert.profileStatus !== "active") {
    return sendError(res, "Expert is not accepting requests", 400);
  }
  // On-site sessions are only offered in Canada
  if (sessionType === "onsite" && (expert.country || "").toLowerCase() !== "canada") {
    return sendError(res, "On-site sessions are only available with experts in Canada", 400);
  }

  const created = await Request.create({
    userId: req.auth.sub,
    expertId: expert._id,
    headline,
    description,
    sessionType,
    timingPreference,
    // Legacy mirrors for older app builds
    projectTitle: headline,
    userMessage: description,
    engagementType: sessionType,
    status: "pending",
  });

  return sendSuccess(res, created, "Request created", 201);
};

const listRequests = async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, "Invalid request query", 400, parsed.error.flatten());
  }

  const requesterRole = req.auth.role;
  const requesterId = req.auth.sub;
  const { role, status, page, limit } = parsed.data;
  const effectiveRole = role || (requesterRole === "expert" ? "expert" : "user");

  if (requesterRole !== "admin" && effectiveRole !== requesterRole) {
    return sendError(res, "Forbidden", 403);
  }

  const filter = {};
  if (status) {
    filter.status = status;
  }

  if (effectiveRole === "user") {
    filter.userId = requesterRole === "admin" && req.query.userId ? req.query.userId : requesterId;
  } else if (effectiveRole === "expert") {
    let expertProfileId;
    if (requesterRole === "admin" && req.query.expertId && mongoose.isValidObjectId(req.query.expertId)) {
      expertProfileId = req.query.expertId;
    } else {
      const profile = await ExpertProfile.findOne({ userId: requesterId }).select("_id");
      if (!profile) {
        return sendSuccess(res, { items: [], pagination: { page, limit, total: 0 } }, "Requests fetched");
      }
      expertProfileId = profile._id;
    }
    filter.expertId = expertProfileId;
  }

  const skip = (page - 1) * limit;
  const [itemsRaw, total] = await Promise.all([
    Request.find(filter)
      .populate("userId", "profile.fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Request.countDocuments(filter),
  ]);
  const items = itemsRaw.map((item) => ({
    ...item,
    userName: item.userId?.profile?.fullName || item.userId?.email || "User",
  }));

  return sendSuccess(res, { items, pagination: { page, limit, total } }, "Requests fetched");
};

const updateRequestStatus = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, "Invalid request id", 400);
  }

  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid status payload", 400, parsed.error.flatten());
  }

  const requestDoc = await Request.findById(req.params.id);
  if (!requestDoc) {
    return sendError(res, "Request not found", 404);
  }

  if (req.auth.role === "expert") {
    const profile = await ExpertProfile.findOne({ userId: req.auth.sub }).select("_id");
    if (!profile || profile._id.toString() !== requestDoc.expertId.toString()) {
      return sendError(res, "Forbidden", 403);
    }
  }

  if (req.auth.role === "user" && requestDoc.userId.toString() !== req.auth.sub) {
    return sendError(res, "Forbidden", 403);
  }

  if (requestDoc.status === "pending" && requestDoc.expiresAt && requestDoc.expiresAt < new Date()) {
    await expireRequest(requestDoc._id);
    return sendError(res, "Request has expired", 400);
  }

  const nextStatus = parsed.data.status;
  const allowed = ALLOWED_TRANSITIONS[req.auth.role]?.[requestDoc.status] || [];
  if (!allowed.includes(nextStatus)) {
    return sendError(res, `Cannot change a ${requestDoc.status} request to ${nextStatus}`, 400);
  }

  requestDoc.status = nextStatus;
  if (nextStatus === "accepted" || nextStatus === "rejected") {
    requestDoc.respondedAt = new Date();
  }
  if (nextStatus === "completed") {
    requestDoc.completedAt = new Date();
  }
  await requestDoc.save();

  if (nextStatus === "accepted") {
    try {
      const Conversation = require("../chat/conversation.model");
      const expertProfile = await ExpertProfile.findById(requestDoc.expertId).select("userId");
      if (expertProfile) {
        const userId = requestDoc.userId;
        const expertUserId = expertProfile.userId;

        let conversation = await Conversation.findOne({ request: requestDoc._id });
        if (!conversation) {
          conversation = await Conversation.create({
            participants: [userId, expertUserId],
            request: requestDoc._id,
          });

          try {
            const { getIo } = require("../../config/socketServer");
            const io = getIo();
            const populated = await Conversation.findById(conversation._id)
              .populate("participants", "profile.fullName email profile.avatarUrl role")
              .lean();
            io.to(`user:${userId.toString()}`).emit("chat:new_conversation", populated);
            io.to(`user:${expertUserId.toString()}`).emit("chat:new_conversation", populated);
          } catch (socketErr) {
            console.error("Socket error during conversation creation", socketErr);
          }
        }
      }
    } catch (err) {
      console.error("Failed to auto-create conversation on accept:", err);
    }
  }

  return sendSuccess(res, requestDoc, "Request status updated");
};

module.exports = { createRequest, listRequests, updateRequestStatus };
