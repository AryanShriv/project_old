const Request = require("./request.model");
const ExpertProfile = require("../experts/expert.model");
const { sendPushToUser } = require("../../utils/push");

const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Mark pending requests past their 48-hour expiresAt as expired and tell the user.
 * Each request is claimed with a conditional update, so running two sweeps at once
 * (e.g. two server instances) never notifies a user twice.
 */
const expireStaleRequests = async (now = new Date()) => {
  const stale = await Request.find({ status: "pending", expiresAt: { $lt: now } })
    .select("_id")
    .lean();

  let expired = 0;
  for (const { _id } of stale) {
    if (await expireRequest(_id)) expired += 1;
  }
  return { expired };
};

/** Expire a single pending request and notify its user. Returns false if it was no longer pending. */
const expireRequest = async (requestId) => {
  const doc = await Request.findOneAndUpdate(
    { _id: requestId, status: "pending" },
    { $set: { status: "expired" } },
    { new: true }
  ).lean();
  if (!doc) return false;

  const expert = await ExpertProfile.findById(doc.expertId).select("fullName").lean();
  const firstName = expert?.fullName?.split(" ")[0] || "The expert";
  await notifyExpired(doc, firstName);
  return true;
};

const notifyExpired = async (doc, expertFirstName) => {
  const payload = {
    requestId: doc._id.toString(),
    status: "expired",
  };

  try {
    const { getIo } = require("../../config/socketServer");
    getIo().to(`user:${doc.userId.toString()}`).emit("request:updated", payload);
  } catch {
    // Socket server is not running (scripts, tests); push still goes out below
  }

  await sendPushToUser(doc.userId, {
    title: "Your request has expired",
    body: `${expertFirstName} wasn't able to respond within 48 hours. You can send a request to another expert.`,
    data: { type: "request_expired", ...payload },
  });
};

const startRequestExpiryJob = () => {
  const run = () =>
    expireStaleRequests().catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Request expiry sweep failed:", err.message);
    });
  run();
  const timer = setInterval(run, SWEEP_INTERVAL_MS);
  timer.unref();
  return timer;
};

module.exports = { expireStaleRequests, expireRequest, startRequestExpiryJob };
