const User = require("../users/user.model");
const { sendSuccess, sendError } = require("../../utils/http");

/**
 * POST /notifications/device-token
 * Stores an Expo push token for the authenticated user.
 * Deduplicates — the same token is never stored twice for the same user.
 */
const registerDeviceToken = async (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== "string" || token.trim() === "") {
    return sendError(res, "token is required", 400);
  }

  const trimmedToken = token.trim();

  // $addToSet is atomic and prevents duplicates.
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { pushTokens: trimmedToken },
  });

  return sendSuccess(res, { registered: true }, "Device token registered", 201);
};

/**
 * DELETE /notifications/device-token
 * Removes a push token (e.g. on logout).
 */
const removeDeviceToken = async (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== "string") {
    return sendError(res, "token is required", 400);
  }

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { pushTokens: token.trim() },
  });

  return sendSuccess(res, { removed: true }, "Device token removed");
};

/**
 * GET /notifications
 * Placeholder — returns the user's stored push tokens so the client can
 * verify registration. Replace with real notification history when ready.
 */
const listNotifications = async (req, res) => {
  const user = await User.findById(req.user._id).select("pushTokens").lean();
  return sendSuccess(res, { items: user?.pushTokens ?? [] });
};

module.exports = { registerDeviceToken, removeDeviceToken, listNotifications };
