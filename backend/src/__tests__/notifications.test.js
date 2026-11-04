/**
 * PRD 5.2: every event notifies on push and email, the Notifications switches are respected,
 * and unread chat messages are emailed once. Runs against the real Express app and an
 * in-memory MongoDB, with push and email mocked.
 */
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

jest.mock("../utils/push", () => ({ sendPushToUser: jest.fn() }));
jest.mock("../utils/email", () => ({ ...jest.requireActual("../utils/email"), sendEmail: jest.fn() }));

const { sendPushToUser } = require("../utils/push");
const { sendEmail } = require("../utils/email");
const app = require("../app");
const User = require("../modules/users/user.model");
const ExpertProfile = require("../modules/experts/expert.model");
const Conversation = require("../modules/chat/conversation.model");
const Message = require("../modules/chat/message.model");
const { signAccessToken } = require("../modules/auth/auth.utils");
const { emailUnreadMessages, pushNewMessage } = require("../modules/chat/chat.notifications");
const { DISCLAIMER_VERSION } = require("../constants/trust");

let mongoServer;
let server;
let baseUrl;
let expertUser;
let expertProfile;
let expertToken;
let learner;
let learnerToken;

const api = async (method, path, { token, body } = {}) => {
  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
};

const pushesTo = (userId) => sendPushToUser.mock.calls.filter(([id]) => id.toString() === userId.toString());
const emailsTo = (email) => sendEmail.mock.calls.filter(([message]) => message.to === email);

const sendRequest = () =>
  api("POST", "/requests", {
    token: learnerToken,
    body: {
      expertId: expertProfile._id.toString(),
      headline: "Planning a kitchen renovation budget",
      description: "We are renovating our kitchen next spring and want to understand realistic costs and order of work.",
      sessionType: "remote",
      timingPreference: "month",
      acknowledgedDisclaimers: ["platform", "trades"],
      disclaimerVersion: DISCLAIMER_VERSION,
    },
  });

const setStatus = (id, status) => api("PATCH", `/requests/${id}/status`, { token: expertToken, body: { status } });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  expertUser = await User.create({
    email: "margaret@example.com",
    passwordHash: "x",
    role: "expert",
    profile: { fullName: "Margaret Singh" },
  });
  expertProfile = await ExpertProfile.create({
    userId: expertUser._id,
    fullName: "Margaret Singh",
    country: "Canada",
    domain: "Construction",
    profileStatus: "active",
    approvalStatus: "approved",
  });
  expertToken = signAccessToken(expertUser);

  learner = await User.create({
    email: "priya@example.com",
    passwordHash: "x",
    role: "user",
    profile: { fullName: "Priya Learner" },
  });
  learnerToken = signAccessToken(learner);
});

afterAll(async () => {
  server.close();
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  sendPushToUser.mockClear();
  sendEmail.mockClear();
  await User.updateMany({}, { $unset: { notificationPrefs: "" } });
});

describe("Request notifications on both channels", () => {
  test("a new request reaches the expert by push and email", async () => {
    const res = await sendRequest();
    expect(res.status).toBe(201);

    const [push] = pushesTo(expertUser._id);
    expect(push[1]).toMatchObject({ title: "New session request from Priya", data: { type: "new_request" } });
    const [email] = emailsTo("margaret@example.com");
    expect(email[0].subject).toBe("New session request from Priya Learner");
    expect(email[0].text).toContain("Planning a kitchen renovation budget");
  });

  test("accepting and declining reach the user by push and email", async () => {
    const accepted = await sendRequest();
    await setStatus(accepted.body.data._id, "accepted");
    expect(pushesTo(learner._id)[0][1]).toMatchObject({
      title: "Margaret Singh accepted your request",
      data: { type: "request_updated", status: "accepted" },
    });
    expect(emailsTo("priya@example.com")[0][0].subject).toBe("Margaret Singh accepted your request");

    sendPushToUser.mockClear();
    sendEmail.mockClear();
    const declined = await sendRequest();
    await setStatus(declined.body.data._id, "rejected");
    expect(pushesTo(learner._id)[0][1].data).toMatchObject({ status: "rejected" });
    expect(emailsTo("priya@example.com")[0][0].subject).toBe("About your request to Margaret Singh");
  });
});

describe("Notification switches", () => {
  test("can be read and changed, and default to on for requests and messages", async () => {
    const initial = await api("GET", "/users/me/notification-prefs", { token: learnerToken });
    expect(initial.body.data).toEqual({ requestUpdates: true, newMessages: true, appUpdates: false });

    const changed = await api("PATCH", "/users/me/notification-prefs", {
      token: learnerToken,
      body: { requestUpdates: false },
    });
    expect(changed.body.data.requestUpdates).toBe(false);
    expect(changed.body.data.newMessages).toBe(true);

    const invalid = await api("PATCH", "/users/me/notification-prefs", { token: learnerToken, body: {} });
    expect(invalid.status).toBe(400);
  });

  test("turning off request updates stops both channels for those events", async () => {
    await User.updateOne({ _id: expertUser._id }, { $set: { "notificationPrefs.requestUpdates": false } });
    await sendRequest();
    expect(pushesTo(expertUser._id)).toHaveLength(0);
    expect(emailsTo("margaret@example.com")).toHaveLength(0);
  });
});

describe("Chat notifications", () => {
  let conversation;

  beforeAll(async () => {
    conversation = await Conversation.create({
      participants: [learner._id, expertUser._id],
      request: new mongoose.Types.ObjectId(),
    });
  });

  beforeEach(() => Message.deleteMany({}));

  test("a new message is pushed to the other participant only", async () => {
    await pushNewMessage(conversation, learner._id, "Thank you, Tuesday at 10 works for me.");
    expect(pushesTo(expertUser._id)[0][1]).toMatchObject({
      title: "Priya Learner",
      body: "Thank you, Tuesday at 10 works for me.",
      data: { type: "new_message", conversationId: conversation._id.toString() },
    });
    expect(pushesTo(learner._id)).toHaveLength(0);
  });

  test("messages unread after an hour produce one email per conversation, once", async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await Message.create([
      { conversation: conversation._id, sender: learner._id, text: "Hello", createdAt: twoHoursAgo },
      { conversation: conversation._id, sender: learner._id, text: "Are you free?", createdAt: twoHoursAgo },
      { conversation: conversation._id, sender: learner._id, text: "Just sent", createdAt: new Date() },
    ]);

    await emailUnreadMessages();
    const emails = emailsTo("margaret@example.com");
    expect(emails).toHaveLength(1);
    expect(emails[0][0].subject).toBe("You have 2 new messages from Priya");

    sendEmail.mockClear();
    await emailUnreadMessages();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test("read messages and people with messages switched off get no email", async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await Message.create({
      conversation: conversation._id,
      sender: learner._id,
      text: "Already read",
      createdAt: twoHoursAgo,
      readAt: new Date(),
    });
    await emailUnreadMessages();
    expect(sendEmail).not.toHaveBeenCalled();

    await User.updateOne({ _id: expertUser._id }, { $set: { "notificationPrefs.newMessages": false } });
    await Message.create({ conversation: conversation._id, sender: learner._id, text: "Unread", createdAt: twoHoursAgo });
    await emailUnreadMessages();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
