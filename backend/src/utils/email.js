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
