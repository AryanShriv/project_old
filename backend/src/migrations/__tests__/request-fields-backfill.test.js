const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { backfillRequestFields } = require("../request-fields-backfill");

let mongoServer;

describe("Request fields backfill", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.collection("requests").deleteMany({});
  });

  test("copies legacy fields into the new fields", async () => {
    const requests = mongoose.connection.db.collection("requests");
    await requests.insertMany([
      { projectTitle: "Cash flow help", description: "", userMessage: "Long message", engagementType: "onsite", budget: 200 },
      { projectTitle: "Pitch review", description: "Existing description", userMessage: "Other", engagementType: "both" },
    ]);

    const result = await backfillRequestFields();
    expect(result.stats.updated).toBe(2);

    const first = await requests.findOne({ projectTitle: "Cash flow help" });
    expect(first.headline).toBe("Cash flow help");
    expect(first.description).toBe("Long message");
    expect(first.sessionType).toBe("onsite");
    expect(first.budget).toBe(200); // legacy data untouched

    const second = await requests.findOne({ projectTitle: "Pitch review" });
    expect(second.description).toBe("Existing description");
    expect(second.sessionType).toBe("remote");
  });

  test("dry run makes no writes", async () => {
    const requests = mongoose.connection.db.collection("requests");
    await requests.insertOne({ projectTitle: "Untouched", engagementType: "remote" });

    const result = await backfillRequestFields({ dryRun: true });
    expect(result.stats.toUpdate).toBe(1);
    expect((await requests.findOne({ projectTitle: "Untouched" })).headline).toBeUndefined();
  });

  test("is idempotent and skips documents that already have a headline", async () => {
    const requests = mongoose.connection.db.collection("requests");
    await requests.insertOne({ projectTitle: "Old title", headline: "New headline" });

    const result = await backfillRequestFields();
    expect(result.stats.updated).toBe(0);
    expect((await requests.findOne({ projectTitle: "Old title" })).headline).toBe("New headline");
  });
});
