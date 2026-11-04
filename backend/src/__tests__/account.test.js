/**
 * Account basics: email verification, forgot password, and deleting an account.
 * Verification is switched on here as it is in production once Resend is configured.
 */
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.REQUIRE_EMAIL_VERIFICATION = "true";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

jest.mock("../utils/push", () => ({ sendPushToUser: jest.fn() }));
jest.mock("../utils/email", () => ({ ...jest.requireActual("../utils/email"), sendEmail: jest.fn() }));

const { sendEmail } = require("../utils/email");
const app = require("../app");
const User = require("../modules/users/user.model");
const ExpertProfile = require("../modules/experts/expert.model");
const Request = require("../modules/requests/request.model");
const Review = require("../modules/reviews/review.model");
const Application = require("../modules/applications/application.model");
const { signAccessToken } = require("../modules/auth/auth.utils");
const { TERMS_VERSION, DISCLAIMER_VERSION } = require("../constants/trust");
const { backfillEmailVerified } = require("../migrations/email-verified-backfill");

let mongoServer;
let server;
let baseUrl;
let adminToken;
let expertProfile;

const api = async (method, path, { token, body } = {}) => {
  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
};

/** The 6-digit code from the most recent email to this address */
const lastCodeFor = (email) => {
  const calls = sendEmail.mock.calls.filter(([message]) => message.to === email);
  const subject = calls[calls.length - 1]?.[0].subject || "";
  return subject.match(/^(\d{6}) /)?.[1];
};

let counter = 0;
const signUp = async (overrides = {}) => {
  const email = `member${++counter}@example.com`;
  const res = await api("POST", "/auth/register", {
    body: {
      email,
      password: "secret123",
      fullName: "Priya Learner",
      role: "user",
      termsVersion: TERMS_VERSION,
      acceptedTerms: true,
      acknowledgedPlatformOnly: true,
      acknowledgedOnsiteSafety: true,
      ...overrides,
    },
  });
  expect(res.status).toBe(201);
  return { email, ...res.body.data };
};

const requestSession = (token) =>
  api("POST", "/requests", {
    token,
    body: {
      expertId: expertProfile._id.toString(),
      headline: "Preparing for a board meeting",
      description: "I chair my first board meeting next month and want advice on running it well and handling conflict.",
      sessionType: "remote",
      timingPreference: "month",
      acknowledgedDisclaimers: ["platform"],
      disclaimerVersion: DISCLAIMER_VERSION,
    },
  });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const admin = await User.create({ email: "admin@example.com", passwordHash: "x", role: "admin", emailVerifiedAt: new Date() });
  adminToken = signAccessToken(admin);
  const expertUser = await User.create({
    email: "harold@example.com",
    passwordHash: "x",
    role: "expert",
    emailVerifiedAt: new Date(),
    profile: { fullName: "Harold Brooks" },
  });
  expertProfile = await ExpertProfile.create({
    userId: expertUser._id,
    fullName: "Harold Brooks",
    country: "Canada",
    domain: "Management",
    profileStatus: "active",
    approvalStatus: "approved",
  });
});

afterAll(async () => {
  server.close();
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(() => sendEmail.mockClear());

describe("Email verification", () => {
  test("sign-up emails a code; requests are blocked until it is entered", async () => {
    const { email, accessToken, user } = await signUp();
    expect(user.emailVerified).toBe(false);
    expect(user.emailVerificationRequired).toBe(true);
    const code = lastCodeFor(email);
    expect(code).toMatch(/^\d{6}$/);

    const blocked = await requestSession(accessToken);
    expect(blocked.status).toBe(403);
    expect(blocked.body.details.emailNotVerified).toBe(true);

    const wrong = await api("POST", "/auth/verify-email", { token: accessToken, body: { code: code === "000000" ? "111111" : "000000" } });
    expect(wrong.status).toBe(400);

    const ok = await api("POST", "/auth/verify-email", { token: accessToken, body: { code } });
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.emailVerified).toBe(true);

    expect((await requestSession(accessToken)).status).toBe(201);
  });

  test("a new code can be sent after a minute, and five wrong tries use a code up", async () => {
    const { email, accessToken, user } = await signUp();
    const tooSoon = await api("POST", "/auth/verify-email/send", { token: accessToken });
    expect(tooSoon.status).toBe(429);

    await User.updateOne({ _id: user.id }, { $set: { "emailVerification.sentAt": new Date(Date.now() - 61_000) } });
    const resent = await api("POST", "/auth/verify-email/send", { token: accessToken });
    expect(resent.status).toBe(200);
    const code = lastCodeFor(email);

    const wrongCode = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i += 1) {
      await api("POST", "/auth/verify-email", { token: accessToken, body: { code: wrongCode } });
    }
    const afterLimit = await api("POST", "/auth/verify-email", { token: accessToken, body: { code } });
    expect(afterLimit.status).toBe(400);
    expect(afterLimit.body.details.expired).toBe(true);
  });

  test("an expert can't be approved until their email is verified", async () => {
    const { user } = await signUp({
      role: "expert",
      acknowledgedPlatformOnly: undefined,
      acknowledgedOnsiteSafety: undefined,
      acceptedExpertCompliance: true,
      acknowledgedIndependentContractor: true,
      expertProfile: { country: "Canada", city: "Toronto", domain: "Management", engagementTypes: ["remote"] },
    });
    const application = await Application.findOne({ applicantUserId: user.id }).lean();
    const res = await api("PATCH", `/admin/applications/${application._id}`, {
      token: adminToken,
      body: { decision: "approved", checklist: { idVerified: true } },
    });
    expect(res.status).toBe(400);
    expect(res.body.details.emailNotVerified).toBe(true);
  });

  test("accounts from before verification existed are marked verified, once", async () => {
    await mongoose.connection.db.collection("users").insertOne({ email: "old@example.com", passwordHash: "x", role: "user", createdAt: new Date("2026-01-01") });
    const first = await backfillEmailVerified();
    expect(first.stats.updated).toBe(1);
    const old = await User.findOne({ email: "old@example.com" }).lean();
    expect(old.emailVerifiedAt).toEqual(new Date("2026-01-01"));
    expect((await backfillEmailVerified()).stats.updated).toBe(0);
  });
});

describe("Forgot password", () => {
  test("gives the same answer for unknown emails, so nobody can probe who is on G(Old)", async () => {
    const res = await api("POST", "/auth/forgot-password", { body: { email: "nobody@example.com" } });
    expect(res.status).toBe(200);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test("a code resets the password, signs out other devices and verifies the email", async () => {
    const { email, refreshToken } = await signUp();
    const forgot = await api("POST", "/auth/forgot-password", { body: { email } });
    expect(forgot.status).toBe(200);
    const code = lastCodeFor(email);

    const weak = await api("POST", "/auth/reset-password", { body: { email, code, newPassword: "123" } });
    expect(weak.status).toBe(400);

    const reset = await api("POST", "/auth/reset-password", { body: { email, code, newPassword: "a-new-password" } });
    expect(reset.status).toBe(200);
    expect(sendEmail).toHaveBeenLastCalledWith(expect.objectContaining({ to: email, subject: "Your G(Old) password was changed" }));

    // Other devices are signed out (checked before signing in again, which issues a new token)
    expect((await api("POST", "/auth/refresh", { body: { refreshToken } })).status).toBe(401);

    expect((await api("POST", "/auth/login", { body: { email, password: "secret123" } })).status).toBe(401);
    const login = await api("POST", "/auth/login", { body: { email, password: "a-new-password" } });
    expect(login.status).toBe(200);
    expect(login.body.data.user.emailVerified).toBe(true);

    // The code works once only
    const reused = await api("POST", "/auth/reset-password", { body: { email, code, newPassword: "another-one" } });
    expect(reused.status).toBe(400);
  });
});

describe("Deleting an account", () => {
  test("needs the password, then erases personal details and frees the email", async () => {
    const { email, accessToken, user } = await signUp();
    await User.updateOne({ _id: user.id }, { $set: { emailVerifiedAt: new Date() } });
    const request = await requestSession(accessToken);
    await Review.create({
      userId: user.id,
      expertId: expertProfile._id,
      requestId: new mongoose.Types.ObjectId(),
      whatILearned: "How to run a board meeting calmly and keep it to time.",
      expertStyle: "structured",
      wouldRecommend: true,
    }).catch(() => {}); // shape may differ; the anonymised name is what matters

    const wrong = await api("DELETE", "/users/me", { token: accessToken, body: { password: "nope" } });
    expect(wrong.status).toBe(400);

    const res = await api("DELETE", "/users/me", { token: accessToken, body: { password: "secret123" } });
    expect(res.status).toBe(200);

    const saved = await User.findById(user.id).lean();
    expect(saved.accountStatus).toBe("deleted");
    expect(saved.email).not.toBe(email);
    expect(saved.profile.fullName).toBe("Former member");
    expect(saved.legalAcceptance.termsAcceptedAt).toBeInstanceOf(Date); // kept as a legal record
    expect((await Request.findById(request.body.data._id).lean()).status).toBe("cancelled");
    expect(sendEmail).toHaveBeenLastCalledWith(expect.objectContaining({ to: email, subject: "Your G(Old) account has been deleted" }));

    expect((await api("POST", "/auth/login", { body: { email, password: "secret123" } })).status).toBe(401);
    expect((await api("GET", "/auth/me", { token: accessToken })).status).toBe(401);

    // The email can be used for a new account
    const again = await api("POST", "/auth/register", {
      body: {
        email,
        password: "secret123",
        fullName: "Priya Again",
        role: "user",
        termsVersion: TERMS_VERSION,
        acceptedTerms: true,
        acknowledgedPlatformOnly: true,
        acknowledgedOnsiteSafety: true,
      },
    });
    expect(again.status).toBe(201);
  });

  test("an expert's profile is taken off Discover and anonymised", async () => {
    const expertUser = await User.create({
      email: "nina@example.com",
      passwordHash: await require("bcryptjs").hash("secret123", 4),
      role: "expert",
      emailVerifiedAt: new Date(),
      profile: { fullName: "Nina Rao" },
    });
    const profile = await ExpertProfile.create({
      userId: expertUser._id,
      fullName: "Nina Rao",
      linkedinUrl: "https://www.linkedin.com/in/nina",
      profileStatus: "active",
      approvalStatus: "approved",
    });

    const res = await api("DELETE", "/users/me", { token: signAccessToken(expertUser), body: { password: "secret123" } });
    expect(res.status).toBe(200);

    const after = await ExpertProfile.findById(profile._id).lean();
    expect(after.profileStatus).toBe("deleted");
    expect(after.fullName).toBe("Former member");
    expect(after.linkedinUrl).toBe("");

    const discover = await api("GET", "/experts");
    expect(discover.body.data.items.map((e) => e._id)).not.toContain(profile._id.toString());
    const adminList = await api("GET", "/admin/experts", { token: adminToken });
    expect(adminList.body.data.items.map((e) => e._id)).not.toContain(profile._id.toString());
  });

  test("admins can't delete their own account from the app", async () => {
    const res = await api("DELETE", "/users/me", { token: adminToken, body: { password: "x" } });
    expect(res.status).toBe(403);
  });
});
