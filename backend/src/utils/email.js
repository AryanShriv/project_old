const env = require("../config/env");

const RESEND_URL = "https://api.resend.com/emails";

/**
 * Send a transactional email through Resend. Without RESEND_API_KEY (local dev, tests)
 * the email is logged instead. Failures are logged and swallowed: an email must never
 * break the action that triggered it.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) return;

  if (!env.resendApiKey) {
    // eslint-disable-next-line no-console
    console.log(`[email:dev] to=${to} subject="${subject}"\n${text}`);
    return;
  }

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.emailFrom, to, subject, text, html: html || toHtml(text) }),
    });
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`Resend email failed with status ${response.status}: ${await response.text()}`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to send email:", err.message);
  }
};

const escapeHtml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Plain, readable HTML: large type and generous spacing for older readers
const toHtml = (text) =>
  `<div style="font-family:Georgia,serif;font-size:18px;line-height:1.6;color:#2E2E28;max-width:560px">${text
    .split("\n\n")
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("")}</div>`;

const SIGN_OFF = "Warmly,\nThe G(Old) team";

const templates = {
  reviewPrompt: ({ userFirstName, expertName }) => ({
    subject: `How was your session with ${expertName}?`,
    text: `Hi ${userFirstName},\n\n${expertName} has marked your session as complete. We'd love to hear what you learned. It takes a minute, and it helps others find the right person.\n\nOpen the G(Old) app and go to Requests to share your thoughts.\n\n${SIGN_OFF}`,
  }),
  verifyEmail: ({ firstName, code }) => ({
    subject: `${code} is your G(Old) verification code`,
    text: `Hi ${firstName},\n\nWelcome to G(Old). To confirm this is your email address, enter this code in the app:\n\n${code}\n\nThe code works for 15 minutes. If you didn't create a G(Old) account, you can ignore this email.\n\n${SIGN_OFF}`,
  }),
  passwordReset: ({ firstName, code }) => ({
    subject: `${code} is your G(Old) password reset code`,
    text: `Hi ${firstName},\n\nWe received a request to reset your G(Old) password. Enter this code in the app to choose a new one:\n\n${code}\n\nThe code works for 15 minutes. If you didn't ask for this, you can ignore this email: your password stays the same.\n\n${SIGN_OFF}`,
  }),
  passwordChanged: ({ firstName }) => ({
    subject: "Your G(Old) password was changed",
    text: `Hi ${firstName},\n\nYour G(Old) password has just been changed, and you have been signed out on your other devices.\n\nIf this wasn't you, please reply to this email straight away so we can help secure your account.\n\n${SIGN_OFF}`,
  }),
  accountDeleted: ({ firstName }) => ({
    subject: "Your G(Old) account has been deleted",
    text: `Hi ${firstName},\n\nAs you asked, we have deleted your G(Old) account and erased your personal details. Reviews and messages you wrote stay visible to the people they were for, shown as from a "Former member".\n\nThank you for being part of G(Old). You are welcome back any time.\n\n${SIGN_OFF}`,
  }),
  newRequest: ({ expertFirstName, userName, headline }) => ({
    subject: `New session request from ${userName}`,
    text: `Hi ${expertFirstName},

${userName} would like a session with you:

"${headline}"

Please open the G(Old) app to accept or decline. Requests expire after 48 hours, so a quick reply helps.

${SIGN_OFF}`,
  }),
  requestAccepted: ({ userFirstName, expertName }) => ({
    subject: `${expertName} accepted your request`,
    text: `Hi ${userFirstName},

Good news: ${expertName} has accepted your session request. You can now message each other in the G(Old) app to agree a time.

${SIGN_OFF}`,
  }),
  requestDeclined: ({ userFirstName, expertName }) => ({
    subject: `About your request to ${expertName}`,
    text: `Hi ${userFirstName},

${expertName} isn't able to take on your request this time. There are other experienced people on G(Old) who may be a great fit. Open the app to find another expert.

${SIGN_OFF}`,
  }),
  requestExpired: ({ userFirstName, expertName }) => ({
    subject: "Your session request has expired",
    text: `Hi ${userFirstName},

${expertName} wasn't able to respond within 48 hours, so your request has expired. You can send a request to another expert in the G(Old) app.

${SIGN_OFF}`,
  }),
  unreadMessages: ({ firstName, senderName, count }) => ({
    subject: `You have ${count === 1 ? "a new message" : `${count} new messages`} from ${senderName}`,
    text: `Hi ${firstName},

${senderName} sent you ${count === 1 ? "a message" : `${count} messages`} on G(Old). Open the app to read and reply.

${SIGN_OFF}`,
  }),
  applicationApproved: ({ firstName }) => ({
    subject: "Welcome to G(Old): your profile is live",
    text: `Hi ${firstName},\n\nGood news: our team has reviewed and approved your expert profile. People can now find you and request sessions.\n\nA good next step is to set your availability in the app.\n\n${SIGN_OFF}`,
  }),
  applicationRejected: ({ firstName, reason, canResubmit }) => ({
    subject: "About your G(Old) expert application",
    text: `Hi ${firstName},\n\nThank you for applying to G(Old). Our team reviewed your profile and isn't able to approve it yet. Here is what they noted:\n\n"${reason}"\n\n${
      canResubmit
        ? "You can update your profile in the app and resubmit it once for another review."
        : "As this was a resubmission, we are not able to review the application again."
    }\n\n${SIGN_OFF}`,
  }),
};

module.exports = { sendEmail, templates };
