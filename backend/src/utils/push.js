const User = require("../modules/users/user.model");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Send a push notification to every registered device of a user via the Expo push service.
 * Failures are logged and swallowed: a push must never break the action that triggered it.
 */
const sendPushToUser = async (userId, { title, body, data = {} }) => {
  try {
    const user = await User.findById(userId).select("pushTokens").lean();
    const tokens = user?.pushTokens ?? [];
    if (tokens.length === 0) return;

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(tokens.map((to) => ({ to, title, body, data, sound: "default" }))),
    });
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`Expo push failed with status ${response.status}`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to send push notification:", err.message);
  }
};

module.exports = { sendPushToUser };
