/**
 * End-to-end checks for the Phase 2 trust rules, run against the real Express app
 * and an in-memory MongoDB.
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
const Application = require("../modules/applications/application.model");
const { signAccessToken } = require("../modules/auth/auth.utils");
const { TERMS_VERSION, DISCLAIMER_VERSION } = require("../constants/trust");

let mongoServer;
let server;
let baseUrl;
let adminToken;

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

let emailCounter = 0;
const uniqueEmail = () => `person${++emailCounter}@example.com`;

const registerUser = async () => {
  const res = await api("POST", "/auth/register", {
    body: {
      email: uniqueEmail(),
      password: "secret123",
      fullName: "Priya Learner",
      role: "user",
      termsVersion: TERMS_VERSION,
      acceptedTerms: true,
      acknowledgedPlatformOnly: true,
      acknowledgedOnsiteSafety: true,
    },
  });
  expect(res.status).toBe(201);
  return res.body.data;
};

const expertBody = (overrides = {}) => ({
  email: uniqueEmail(),
  password: "secret123",
  fullName: "Margaret Singh",
  role: "expert",
  termsVersion: TERMS_VERSION,
  acceptedTerms: true,
  acceptedExpertCompliance: true,
  acknowledgedIndependentContractor: true,
  acknowledgedInsurance: true,
  expertProfile: {
    country: "Canada",
    city: "Toronto",
    domain: "Legal",
    engagementTypes: ["remote"],
    ...overrides,
  },
});

const registerExpert = async (overrides) => {
  const res = await api("POST", "/auth/register", { body: expertBody(overrides) });
  expect(res.status).toBe(201);
  return res.body.data;
};

const pendingApplicationFor = async (userId) =>
  Application.findOne({ applicantUserId: userId, status: "pending" }).lean();

const approve = (applicationId, checklist) =>
  api("PATCH", `/admin/applications/${applicationId}`, {
    token: adminToken,
    body: { decision: "approved", checklist },
  });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const admin = await User.create({ email: "admin@example.com", passwordHash: "x", role: "admin" });
  adminToken = signAccessToken(admin);
});

afterAll(async () => {
  server.close();
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(() => {
  sendPushToUser.mockClear();
  sendEmail.mockClear();
});

describe("Terms acceptance (PRD 4.5)", () => {
  test("stores the Terms version and each acknowledgement with a timestamp", async () => {
    const { user } = await registerUser();
    const saved = await User.findById(user.id).lean();
    expect(saved.legalAcceptance.termsVersion).toBe(TERMS_VERSION);
    expect(saved.legalAcceptance.platformOnlyAcknowledgedAt).toBeInstanceOf(Date);
    expect(saved.legalAcceptance.onsiteSafetyAcknowledgedAt).toBeInstanceOf(Date);
  });

  test("rejects signups on an outdated Terms version or missing acknowledgements", async () => {
    const outdated = await api("POST", "/auth/register", { body: { ...expertBody(), termsVersion: "old" } });
    expect(outdated.status).toBe(400);

    const missing = await api("POST", "/auth/register", {
      body: { ...expertBody(), acknowledgedIndependentContractor: false },
    });
    expect(missing.status).toBe(400);
  });
});

describe("Credentials and approval (PRD 4.4)", () => {
  test("regulated trades must provide a certificate at signup", async () => {
    const res = await api("POST", "/auth/register", { body: expertBody({ domain: "Electrical" }) });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/certificate/i);
  });

  test("on-site work needs an insurance declaration and is Canada only", async () => {
    const noInsurance = await api("POST", "/auth/register", {
      body: expertBody({ domain: "Tiling", engagementTypes: ["onsite"] }),
    });
    expect(noInsurance.status).toBe(400);

    const india = await api("POST", "/auth/register", {
      body: expertBody({ country: "India", city: "Pune", engagementTypes: ["onsite"], insuranceDeclared: true }),
    });
    expect(india.status).toBe(400);
  });

  test("approval needs the checklist, and only then marks the licence verified", async () => {
    const { user } = await registerExpert({
      domain: "Electrical",
      engagementTypes: ["remote", "onsite"],
      insuranceDeclared: true,
      certification: { type: "309A Electrician", number: "ON-12345", issuingBody: "Skilled Trades Ontario" },
    });
    const application = await pendingApplicationFor(user.id);

    const incomplete = await approve(application._id, { idVerified: true });
    expect(incomplete.status).toBe(400);
    expect(incomplete.body.details.missing).toEqual(["certificateVerified", "insuranceConfirmed"]);

    const ok = await approve(application._id, { idVerified: true, certificateVerified: true, insuranceConfirmed: true });
    expect(ok.status).toBe(200);

    const profile = await ExpertProfile.findOne({ userId: user.id }).lean();
    expect(profile.approvalStatus).toBe("approved");
    expect(profile.certifications[0].verified).toBe(true);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ subject: expect.stringMatching(/live/) }));

    // Internal checklist never reaches the public profile
    const publicProfile = await api("GET", `/experts/${profile._id}`);
    expect(publicProfile.body.data.verificationChecklist).toBeUndefined();
  });

  test("rejection needs a reason, emails it, and allows exactly one resubmission", async () => {
    const { user, accessToken } = await registerExpert();
    const first = await pendingApplicationFor(user.id);

    const noReason = await api("PATCH", `/admin/applications/${first._id}`, {
      token: adminToken,
      body: { decision: "rejected" },
    });
    expect(noReason.status).toBe(400);

    const reason = "Please add your career highlights so we can verify your experience.";
    await api("PATCH", `/admin/applications/${first._id}`, {
      token: adminToken,
      body: { decision: "rejected", note: reason },
    });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining(reason) }));

    const resubmit = await api("POST", "/applications/expert", { token: accessToken, body: {} });
    expect(resubmit.status).toBe(201);

    const second = await pendingApplicationFor(user.id);
    await api("PATCH", `/admin/applications/${second._id}`, {
      token: adminToken,
      body: { decision: "rejected", note: "Still unable to verify the experience listed." },
    });

    const again = await api("POST", "/applications/expert", { token: accessToken, body: {} });
    expect(again.status).toBe(403);
  });
});

describe("Sessions, disclaimers and reviews (PRD 4.1, 4.6)", () => {
  let expertProfile;
  let expertToken;
  let userToken;

  const createRequest = (body) =>
    api("POST", "/requests", {
      token: userToken,
      body: {
        expertId: expertProfile._id.toString(),
        headline: "Understanding a commercial lease",
        description: "I am about to sign a five year commercial lease and want to understand the key clauses first.",
        sessionType: "remote",
        timingPreference: "week",
        ...body,
      },
    });

  beforeAll(async () => {
    const expert = await registerExpert({ domain: "Legal" });
    const application = await pendingApplicationFor(expert.user.id);
    await approve(application._id, { idVerified: true });
    expertProfile = await ExpertProfile.findOne({ userId: expert.user.id }).lean();
    const expertUser = await User.findById(expert.user.id);
    expertToken = signAccessToken(expertUser);
    userToken = (await registerUser()).accessToken;
  });

  const completedSession = async () => {
    const created = await createRequest({
      acknowledgedDisclaimers: ["platform", "advice_legal"],
      disclaimerVersion: DISCLAIMER_VERSION,
    });
    expect(created.status).toBe(201);
    const id = created.body.data._id;
    await api("PATCH", `/requests/${id}/status`, { token: expertToken, body: { status: "accepted" } });
    await api("PATCH", `/requests/${id}/status`, { token: expertToken, body: { status: "completed" } });
    return id;
  };

  test("a request to a Legal expert needs the legal disclaimer acknowledged", async () => {
    const res = await createRequest({ acknowledgedDisclaimers: ["platform"], disclaimerVersion: DISCLAIMER_VERSION });
    expect(res.status).toBe(400);
    expect(res.body.details.missing).toEqual(["advice_legal"]);
  });

  test("completing a session prompts the user to review by push and email", async () => {
    await completedSession();
    expect(sendPushToUser).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: expect.objectContaining({ type: "review_prompt" }) })
    );
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ subject: "How was your session with Margaret Singh?" }));
  });

  test("reviews are one per completed session and drive the recommendation stats", async () => {
    const pending = await createRequest({
      acknowledgedDisclaimers: ["platform", "advice_legal"],
      disclaimerVersion: DISCLAIMER_VERSION,
    });
    const review = (requestId, body = {}) =>
      api("POST", `/reviews/${expertProfile._id}`, {
        token: userToken,
        body: {
          requestId,
          whatILearned: "Which lease clauses to negotiate and which are standard.",
          expertStyle: "structured",
          wouldRecommend: true,
          ...body,
        },
      });

    expect((await review(pending.body.data._id)).status).toBe(403); // not completed yet

    const sessionId = await completedSession();
    expect((await review(sessionId, { whatILearned: "Too short" })).status).toBe(400);
    expect((await review(sessionId)).status).toBe(201);
    expect((await review(sessionId)).status).toBe(409); // one per session

    let profile = await ExpertProfile.findById(expertProfile._id).lean();
    expect(profile.reviewCount).toBe(1);
    expect(profile.recommendPercentage).toBe(100);
    expect(profile.styleBreakdown.structured).toBe(1);

    // Admin hides it: gone from the profile and from the stats
    const listed = await api("GET", "/admin/reviews", { token: adminToken });
    const reviewId = listed.body.data.items[0]._id;
    expect((await api("PATCH", `/admin/reviews/${reviewId}/visibility`, { token: adminToken, body: { hidden: true } })).status).toBe(400);
    await api("PATCH", `/admin/reviews/${reviewId}/visibility`, {
      token: adminToken,
      body: { hidden: true, note: "Contains personal details" },
    });

    const publicReviews = await api("GET", `/reviews/${expertProfile._id}`);
    expect(publicReviews.body.data.items).toHaveLength(0);
    profile = await ExpertProfile.findById(expertProfile._id).lean();
    expect(profile.reviewCount).toBe(0);
    expect(profile.recommendPercentage).toBeNull();
  });
});
