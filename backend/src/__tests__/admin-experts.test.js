/**
 * Admin Experts tab: the list includes suspended experts, and the Founding Expert badge (PRD 5.4).
 */
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

jest.mock("../utils/push", () => ({ sendPushToUser: jest.fn() }));
jest.mock("../utils/email", () => ({ ...jest.requireActual("../utils/email"), sendEmail: jest.fn() }));

const app = require("../app");
const User = require("../modules/users/user.model");
const ExpertProfile = require("../modules/experts/expert.model");
const AuditLog = require("../modules/admin/audit-log.model");
const { signAccessToken } = require("../modules/auth/auth.utils");

let mongoServer;
let server;
let baseUrl;
let adminToken;
let approved;
let pending;

const api = async (method, path, { token, body } = {}) => {
  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
};

const makeExpert = async (name, approvalStatus) => {
  const user = await User.create({ email: `${name}@example.com`, passwordHash: "x", role: "expert" });
  return ExpertProfile.create({
    userId: user._id,
    fullName: name,
    approvalStatus,
    profileStatus: approvalStatus === "approved" ? "active" : "pending_review",
  });
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const admin = await User.create({ email: "admin@example.com", passwordHash: "x", role: "admin" });
  adminToken = signAccessToken(admin);
  approved = await makeExpert("Harold", "approved");
  pending = await makeExpert("Nina", "pending");
});

afterAll(async () => {
  server.close();
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("suspended experts stay in the admin list so they can be reactivated", async () => {
  await api("PATCH", `/admin/experts/${approved._id}/status`, { token: adminToken, body: { status: "suspended" } });

  const publicList = await api("GET", "/experts");
  expect(publicList.body.data.items.map((e) => e.fullName)).not.toContain("Harold");

  const adminList = await api("GET", "/admin/experts", { token: adminToken });
  const harold = adminList.body.data.items.find((e) => e.fullName === "Harold");
  expect(harold.profileStatus).toBe("suspended");
  expect(adminList.body.data.items.map((e) => e.fullName)).not.toContain("Nina"); // not approved yet

  await api("PATCH", `/admin/experts/${approved._id}/status`, { token: adminToken, body: { status: "active" } });
});

test("only admins can list experts or change the Founding Expert badge", async () => {
  const learner = await User.create({ email: "learner@example.com", passwordHash: "x", role: "user" });
  const token = signAccessToken(learner);
  expect((await api("GET", "/admin/experts", { token })).status).toBe(403);
  expect(
    (await api("PATCH", `/admin/experts/${approved._id}/founder`, { token, body: { founderBadge: true } })).status
  ).toBe(403);
});

test("an approved expert can be marked a Founding Expert, which shows publicly and is audited", async () => {
  const res = await api("PATCH", `/admin/experts/${approved._id}/founder`, {
    token: adminToken,
    body: { founderBadge: true },
  });
  expect(res.status).toBe(200);

  const profile = await api("GET", `/experts/${approved._id}`);
  expect(profile.body.data.founderBadge).toBe(true);

  const log = await AuditLog.findOne({ action: "founder_badge_updated", entityId: approved._id.toString() }).lean();
  expect(log.metadata.founderBadge).toBe(true);
});

test("an expert who is not approved cannot be a Founding Expert", async () => {
  const res = await api("PATCH", `/admin/experts/${pending._id}/founder`, {
    token: adminToken,
    body: { founderBadge: true },
  });
  expect(res.status).toBe(400);
});
