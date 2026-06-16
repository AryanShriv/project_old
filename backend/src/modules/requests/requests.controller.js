const mongoose = require("mongoose");
const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const Request = require("./request.model");
const ExpertProfile = require("../experts/expert.model");

const createSchema = z.object({
  expertId: z.string().trim().min(1),
  projectTitle: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(4000).optional(),
  budget: z.number().min(0).optional(),
  userMessage: z.string().trim().min(10).max(500).optional(),
  engagementType: z.enum(["remote", "onsite", "both", "ongoing"]).optional(),
  timingPreference: z.enum(["asap", "week", "month", "flexible"]).optional(),
});

const listSchema = z.object({
  role: z.enum(["user", "expert"]).optional(),
  status: z.enum(["pending", "accepted", "rejected", "cancelled", "completed"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const statusUpdateSchema = z.object({
  status: z.enum(["accepted", "rejected", "cancelled", "completed"]),
});

const createRequest = async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Invalid request payload", 400, parsed.error.flatten());
  }

  const {
    expertId,
    projectTitle,
    description = "",
    budget = 0,
    userMessage = "",
    engagementType = "remote",
    timingPreference = "flexible",
  } = parsed.data;

  if (!mongoose.isValidObjectId(expertId)) {
    return sendError(res, "Invalid expertId", 400);
  }

  const expert = await ExpertProfile.findById(expertId).select("_id profileStatus");
  if (!expert) {
    return sendError(res, "Expert not found", 404);
  }
  if (expert.profileStatus !== "active") {
    return sendError(res, "Expert is not accepting requests", 400);
  }

  const finalTitle = projectTitle || userMessage.substring(0, 160) || "Untitled Request";

  const created = await Request.create({
    userId: req.auth.sub,
    expertId: expert._id,
    projectTitle: finalTitle,
    description,
    budget,
    userMessage,
    engagementType,
    timingPreference,
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
    if (!["accepted", "rejected", "completed"].includes(parsed.data.status)) {
      return sendError(res, "Expert can only set accepted, rejected, or completed", 400);
    }
  }

  if (req.auth.role === "user") {
    if (requestDoc.userId.toString() !== req.auth.sub) {
      return sendError(res, "Forbidden", 403);
    }
    if (parsed.data.status !== "cancelled") {
      return sendError(res, "User can only cancel requests", 400);
    }
    if (requestDoc.status !== "pending") {
      return sendError(res, "Only pending requests can be cancelled", 400);
    }
    requestDoc.status = "cancelled";
    await requestDoc.save();
    return sendSuccess(res, requestDoc, "Request status updated");
  }

  if (req.auth.role === "admin" || req.auth.role === "expert") {
    if (requestDoc.status === "rejected" && parsed.data.status === "accepted") {
      return sendError(res, "Cannot accept an already rejected request", 400);
    }
    const previousStatus = requestDoc.status;
    requestDoc.status = parsed.data.status;
    await requestDoc.save();

    if (previousStatus !== "accepted" && parsed.data.status === "accepted") {
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
  }

  return sendError(res, "Forbidden", 403);
};

module.exports = { createRequest, listRequests, updateRequestStatus };
