const mongoose = require("mongoose");
const { z } = require("zod");
const { sendSuccess, sendError } = require("../../utils/http");
const Conversation = require("./conversation.model");
const Message = require("./message.model");
const User = require("../users/user.model");

const listConversations = async (req, res) => {
  const userId = req.auth.sub;

  const conversations = await Conversation.find({ participants: userId })
    .populate("participants", "profile.fullName email profile.avatarUrl role")
    .sort({ updatedAt: -1 })
    .lean();

  // Attach unread count
  const withUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: userId },
        readAt: null,
      });
      return { ...conv, unreadCount };
    })
  );

  return sendSuccess(res, { items: withUnread }, "Conversations fetched");
};

const getMessages = async (req, res) => {
  const { id } = req.params;
  const { cursor } = req.query; // optional message ID for pagination

  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, "Invalid conversation id", 400);
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return sendError(res, "Conversation not found", 404);
  }

  if (req.auth.role !== "admin" && !conversation.participants.includes(req.auth.sub)) {
    return sendError(res, "Forbidden", 403);
  }

  const limit = 30;
  const filter = { conversation: id };
  if (cursor && mongoose.isValidObjectId(cursor)) {
    filter._id = { $lt: cursor };
  }

  const messages = await Message.find(filter)
    .sort({ _id: -1 })
    .limit(limit)
    .lean();

  return sendSuccess(res, { items: messages.reverse() }, "Messages fetched"); // Return chronologically
};

const markAsRead = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, "Invalid conversation id", 400);
  }

  const conversation = await Conversation.findById(id);
  if (!conversation || !conversation.participants.includes(req.auth.sub)) {
    return sendError(res, "Forbidden", 403);
  }

  await Message.updateMany(
    {
      conversation: id,
      sender: { $ne: req.auth.sub },
      readAt: null,
    },
    { $set: { readAt: new Date() } }
  );

  return sendSuccess(res, null, "Messages marked as read");
};

// Admin Endpoints
const adminListConversations = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Conversation.find()
      .populate("participants", "profile.fullName email role")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Conversation.countDocuments(),
  ]);

  return sendSuccess(res, { items, pagination: { page, limit, total } }, "Admin conversations fetched");
};

module.exports = {
  listConversations,
  getMessages,
  markAsRead,
  adminListConversations,
};
