const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { backfillTrustFields, normaliseStyle } = require("../trust-fields-backfill");

let mongoServer;

describe("Trust fields backfill", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test("maps free-text review styles onto the three options", () => {
    expect(normaliseStyle("Very structured and methodical")).toBe("structured");
    expect(normaliseStyle("Patient, friendly")).toBe("conversational");
    expect(normaliseStyle("Hands-on demos")).toBe("hands_on");
    expect(normaliseStyle("Great")).toBe("");
    expect(normaliseStyle("hands_on")).toBe("hands_on");
  });

  test("fills new fields from legacy ones, recalculates stats, and is idempotent", async () => {
    const db = mongoose.connection.db;
    const expertId = new mongoose.Types.ObjectId();
    await db.collection("expertprofiles").insertOne({
      _id: expertId,
      userId: new mongoose.Types.ObjectId(),
      fullName: "Ravi Kumar",
      engagementType: "both",
      availabilityRadius: 25,
      certifications: [{ type: "Gas Technician", number: "G2-1", body: "TSSA" }],
      reviewCount: 9, // drifted value from the old increment logic
    });
    await db.collection("reviews").insertMany([
      { expertId, userId: new mongoose.Types.ObjectId(), requestId: new mongoose.Types.ObjectId(), comment: "Learned how to plan a gas line", expertStyle: "Very practical", wouldRecommend: true },
      { expertId, userId: new mongoose.Types.ObjectId(), requestId: new mongoose.Types.ObjectId(), comment: "Useful", expertStyle: "", wouldRecommend: false },
    ]);

    const dry = await backfillTrustFields({ dryRun: true });
    expect(dry.stats).toEqual({ expertsUpdated: 1, reviewsUpdated: 2, statsRecomputed: 0 });
    expect((await db.collection("expertprofiles").findOne({ _id: expertId })).engagementTypes).toBeUndefined();

    await backfillTrustFields();
    const expert = await db.collection("expertprofiles").findOne({ _id: expertId });
    expect(expert.engagementTypes).toEqual(["remote", "onsite"]);
    expect(expert.onsiteRadiusKm).toBe(25);
    expect(expert.certifications[0].issuingBody).toBe("TSSA");
    expect(expert.reviewCount).toBe(2);
    expect(expert.recommendPercentage).toBe(50);
    expect(expert.styleBreakdown.hands_on).toBe(1);

    const review = await db.collection("reviews").findOne({ expertStyle: "hands_on" });
    expect(review.whatILearned).toBe("Learned how to plan a gas line");

    const again = await backfillTrustFields();
    expect(again.stats.expertsUpdated).toBe(0);
    expect(again.stats.reviewsUpdated).toBe(0);
  });
});
