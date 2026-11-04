const Message = require("./message.model");
const Conversation = require("./conversation.model");
const User = require("../users/user.model");
const { templates } = require("../../utils/email");
const { notify, firstNameOf } = require("../../utils/notify");

const UNREAD_EMAIL_AFTER_MS = 60 * 60 * 1000; // 1 hour
const LOOKBACK_MS = 24 * 60 * 60 * 1000; // older unread messages are never emailed about
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const PREVIEW_LENGTH = 120;

/**
 * Push for a new chat message to everyone in the conversation except the sender (PRD 5.2).
 * The app hides these banners while it is open, because the conversation updates live.
 */
const pushNewMessage = async (conversation, senderId, text) => {
  const sender = await User.findById(senderId).select("profile.fullName").lean();
  const senderName = sender?.profile?.fullName || "Someone";
  const body = text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH - 1)}…` : text;

  const recipients = conversation.participants.filter((id) => id.toString() !== senderId.toString());
  await Promise.all(
    recipients.map((recipientId) =>
      notify(recipientId, {
        kind: "messages",
        push: {
          title: senderName,
          body,
          data: { type: "new_message", conversationId: conversation._id.toString() },
        },
      })
    )
  );
};

/**
 * One email per conversation when messages are still unread an hour after they were sent.
 * Each message is claimed with unreadEmailSentAt, so nobody is emailed twice about the same message.
 */
const emailUnreadMessages = async (now = new Date()) => {
  const unread = await Message.find({
    readAt: null,
    unreadEmailSentAt: null,
    createdAt: { $lt: new Date(now - UNREAD_EMAIL_AFTER_MS), $gt: new Date(now - LOOKBACK_MS) },
  })
    .select("_id conversation sender")
    .lean();

  // Group by conversation and sender: one email per conversation for the other participant
  const groups = new Map();
  for (const message of unread) {
    const key = `${message.conversation}:${message.sender}`;
    if (!groups.has(key)) groups.set(key, { conversationId: message.conversation, senderId: message.sender, ids: [] });
    groups.get(key).ids.push(message._id);
  }

  let emails = 0;
  for (const { conversationId, senderId, ids } of groups.values()) {
    const claimed = await Message.updateMany(
      { _id: { $in: ids }, unreadEmailSentAt: null },
      { $set: { unreadEmailSentAt: now } }
    );
    if (claimed.modifiedCount === 0) continue; // another sweep got there first

    const conversation = await Conversation.findById(conversationId).select("participants").lean();
    if (!conversation) continue;
    const sender = await User.findById(senderId).select("profile.fullName").lean();
    const senderName = sender?.profile?.fullName || "Someone";

    const recipients = conversation.participants.filter((id) => id.toString() !== senderId.toString());
    for (const recipientId of recipients) {
      await notify(recipientId, {
        kind: "messages",
        email: (firstName) =>
          templates.unreadMessages({ firstName, senderName: firstNameOf(senderName, senderName), count: claimed.modifiedCount }),
      });
      emails += 1;
    }
  }
  return { emails };
};

const startUnreadMessageEmailJob = () => {
  const run = () =>
    emailUnreadMessages().catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Unread message email sweep failed:", err.message);
    });
  const timer = setInterval(run, SWEEP_INTERVAL_MS);
  timer.unref();
  return timer;
};

module.exports = { pushNewMessage, emailUnreadMessages, startUnreadMessageEmailJob };
