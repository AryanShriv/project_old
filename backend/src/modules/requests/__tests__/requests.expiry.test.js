const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

jest.mock("../../../utils/push", () => ({ sendPushToUser: jest.fn() }));
jest.mock("../../../utils/email", () => ({ ...jest.requireActual("../../../utils/email"), sendEmail: jest.fn() }));

const { sendPushToUser } = require("../../../utils/push");
const { sendEmail } = require("../../../utils/email");
const User = require("../../users/user.model");
const Request = require("../request.model");
const ExpertProfile = require("../../experts/expert.model");
const { expireStaleRequests } = require("../requests.expiry");

let mongoServer;

describe("Request expiry job", () => {
  let expert;
  const userId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await User.create({ _id: userId, email: "priya@example.com", passwordHash: "x", profile: { fullName: "Priya Learner" } });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Request.deleteMany({});
    await ExpertProfile.deleteMany({});
    sendPushToUser.mockClear();
    sendEmail.mockClear();
    expert = await ExpertProfile.create({ userId: new mongoose.Types.ObjectId(), fullName: "Margaret Singh" });
  });

  const makeRequest = (overrides) =>
    Request.create({ userId, expertId: expert._id, projectTitle: "Help", status: "pending", ...overrides });

  test("sets requests older than 48 hours to expired and notifies the user", async () => {
    const stale = await makeRequest({ expiresAt: new Date(Date.now() - 1000) });
    const fresh = await makeRequest({});

    const result = await expireStaleRequests();

    expect(result.expired).toBe(1);
    expect((await Request.findById(stale._id)).status).toBe("expired");
    expect((await Request.findById(fresh._id)).status).toBe("pending");
    expect(sendPushToUser).toHaveBeenCalledTimes(1);
    expect(sendPushToUser.mock.calls[0][0].toString()).toBe(userId.toString());
    expect(sendPushToUser.mock.calls[0][1].body).toContain("Margaret");
    // PRD 5.2: email as well as push
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({ to: "priya@example.com" });
    expect(sendEmail.mock.calls[0][0].text).toContain("Hi Priya");
  });

  test("new requests get a 48 hour expiry", async () => {
    const created = await makeRequest({});
    const hours = (created.expiresAt - created.createdAt) / 3_600_000;
    expect(Math.round(hours)).toBe(48);
  });

  test("does not touch requests the expert already answered", async () => {
    await makeRequest({ status: "accepted", expiresAt: new Date(Date.now() - 1000) });

    const result = await expireStaleRequests();

    expect(result.expired).toBe(0);
    expect(sendPushToUser).not.toHaveBeenCalled();
  });
});
