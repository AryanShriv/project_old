const mongoose = require("mongoose");
const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const Request = require("./request.model");
const FreelancerProfile = require("../freelancers/freelancer.model");

const createSchema = z.object({
  freelancerId: z.string().trim().min(1),
  projectTitle: z.string().trim().min(3).max(160),
  description: z.string().trim().max(4000).optional(),
  budget: z.number().min(0).optional(),
});

const listSchema = z.object({
  role: z.enum(["client", "freelancer"]).optional(),
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

  const { freelancerId, projectTitle, description = "", budget = 0 } = parsed.data;
  if (!mongoose.isValidObjectId(freelancerId)) {
    return sendError(res, "Invalid freelancerId", 400);
  }

  const freelancer = await FreelancerProfile.findById(freelancerId).select("_id profileStatus");
  if (!freelancer) {
    return sendError(res, "Freelancer not found", 404);
  }
  if (freelancer.profileStatus !== "active") {
    return sendError(res, "Freelancer is not accepting requests", 400);
  }

  const created = await Request.create({
    clientId: req.auth.sub,
    freelancerId: freelancer._id,
    projectTitle,
    description,
    budget,
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
  const effectiveRole = role || (requesterRole === "freelancer" ? "freelancer" : "client");

  if (requesterRole !== "admin" && effectiveRole !== requesterRole) {
    return sendError(res, "Forbidden", 403);
  }

  const filter = {};
  if (status) {
    filter.status = status;
  }

  if (effectiveRole === "client") {
    filter.clientId = requesterRole === "admin" && req.query.clientId ? req.query.clientId : requesterId;
  } else if (effectiveRole === "freelancer") {
    let freelancerProfileId;
    if (requesterRole === "admin" && req.query.freelancerId && mongoose.isValidObjectId(req.query.freelancerId)) {
      freelancerProfileId = req.query.freelancerId;
    } else {
      const profile = await FreelancerProfile.findOne({ userId: requesterId }).select("_id");
      if (!profile) {
        return sendSuccess(res, { items: [], pagination: { page, limit, total: 0 } }, "Requests fetched");
      }
      freelancerProfileId = profile._id;
    }
    filter.freelancerId = freelancerProfileId;
  }

  const skip = (page - 1) * limit;
  const [itemsRaw, total] = await Promise.all([
    Request.find(filter)
      .populate("clientId", "profile.fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Request.countDocuments(filter),
  ]);
  const items = itemsRaw.map((item) => ({
    ...item,
    clientName: item.clientId?.profile?.fullName || item.clientId?.email || "Client",
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

  if (req.auth.role === "freelancer") {
    const profile = await FreelancerProfile.findOne({ userId: req.auth.sub }).select("_id");
    if (!profile || profile._id.toString() !== requestDoc.freelancerId.toString()) {
      return sendError(res, "Forbidden", 403);
    }
    if (!["accepted", "rejected", "completed"].includes(parsed.data.status)) {
      return sendError(res, "Freelancer can only set accepted, rejected, or completed", 400);
    }
  }

  if (req.auth.role === "client") {
    if (requestDoc.clientId.toString() !== req.auth.sub) {
      return sendError(res, "Forbidden", 403);
    }
    if (parsed.data.status !== "cancelled") {
      return sendError(res, "Client can only cancel requests", 400);
    }
    if (requestDoc.status !== "pending") {
      return sendError(res, "Only pending requests can be cancelled", 400);
    }
    requestDoc.status = "cancelled";
    await requestDoc.save();
    return sendSuccess(res, requestDoc, "Request status updated");
  }

  if (req.auth.role === "admin" || req.auth.role === "freelancer") {
    if (requestDoc.status === "rejected" && parsed.data.status === "accepted") {
      return sendError(res, "Cannot accept an already rejected request", 400);
    }
    const previousStatus = requestDoc.status;
    requestDoc.status = parsed.data.status;
    await requestDoc.save();

    if (previousStatus !== "accepted" && parsed.data.status === "accepted") {
      try {
        const Conversation = require("../chat/conversation.model");
        const freelancerProfile = await FreelancerProfile.findById(requestDoc.freelancerId).select("userId");
        if (freelancerProfile) {
          const clientId = requestDoc.clientId;
          const freelancerUserId = freelancerProfile.userId;

          let conversation = await Conversation.findOne({ request: requestDoc._id });
          if (!conversation) {
            conversation = await Conversation.create({
              participants: [clientId, freelancerUserId],
              request: requestDoc._id,
            });
            
            try {
              const { getIo } = require("../../config/socketServer");
              const io = getIo();
              const populated = await Conversation.findById(conversation._id)
                .populate("participants", "profile.fullName email profile.avatarUrl role")
                .lean();
              io.to(`user:${clientId.toString()}`).emit("chat:new_conversation", populated);
              io.to(`user:${freelancerUserId.toString()}`).emit("chat:new_conversation", populated);
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
