const User = require("../modules/users/user.model");
const { sendPushToUser } = require("./push");
const { sendEmail } = require("./email");

/**
 * Which Notifications-screen switch controls each kind of notification (PRD 5.2).
 * "account" (application approved/rejected) is always sent.
 */
const PREF_FOR = {
  account: null,
  requests: "requestUpdates",
  messages: "newMessages",
};

const firstNameOf = (fullName, fallback = "there") => (fullName || "").trim().split(/\s+/)[0] || fallback;

/**
 * Send one notification on both channels: push to every device, and an email.
 * `email` receives the recipient's first name and returns { subject, text }.
 * Respects the person's notification switches; never throws.
 *
 *   notify(userId, {
 *     kind: "requests",
 *     push: { title, body, data },
 *     email: (firstName) => templates.requestAccepted({ userFirstName: firstName, expertName }),
 *   })
 */
const notify = async (userId, { kind, push, email }) => {
  try {
    const user = await User.findById(userId).select("email profile.fullName notificationPrefs accountStatus").lean();
    if (!user || user.accountStatus === "deleted") return;

    const pref = PREF_FOR[kind];
    if (pref && user.notificationPrefs?.[pref] === false) return;

    const firstName = firstNameOf(user.profile?.fullName);
    await Promise.all([
      push ? sendPushToUser(userId, push) : null,
      email ? sendEmail({ to: user.email, ...email(firstName) }) : null,
    ]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to send notification:", err.message);
  }
};

module.exports = { notify, firstNameOf };
