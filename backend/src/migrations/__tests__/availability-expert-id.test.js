const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { renameAvailabilityExpertId } = require("../availability-expert-id");

let mongoServer;

describe("Availability freelancerId -> expertId migration", () => {
  const expertA = new mongoose.Types.ObjectId();
  const expertB = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const db = mongoose.connection.db;
    for (const name of ["availabilities", "availabilityexceptions"]) {
      await db.collection(name).drop().catch(() => {});
    }
    // The data and indexes exactly as the old code left them
    const availabilities = db.collection("availabilities");
    await availabilities.createIndex({ freelancerId: 1 }, { unique: true });
    await availabilities.insertMany([
      { freelancerId: expertA, timezone: "America/Toronto", slots: [] },
      { freelancerId: expertB, timezone: "Asia/Kolkata", slots: [] },
    ]);
    const exceptions = db.collection("availabilityexceptions");
    await exceptions.createIndex({ freelancerId: 1, date: 1 }, { unique: true });
    await exceptions.insertMany([
      { freelancerId: expertA, date: "2026-12-24", kind: "blocked" },
      { freelancerId: expertB, date: "2026-12-24", kind: "blocked" },
    ]);
  });

  test("dry-run counts without changing anything", async () => {
    const result = await renameAvailabilityExpertId({ dryRun: true });
    expect(result.stats.availabilities.toRename).toBe(2);
    expect(result.stats.availabilityexceptions.legacyIndexes).toContain("freelancerId_1_date_1");
    const doc = await mongoose.connection.db.collection("availabilities").findOne({ freelancerId: expertA });
    expect(doc).not.toBeNull();
  });

  test("renames the field, swaps the indexes, and is safe to run again", async () => {
    const first = await renameAvailabilityExpertId();
    expect(first.stats.availabilities.renamed).toBe(2);
    expect(first.stats.availabilityexceptions.renamed).toBe(2);

    const db = mongoose.connection.db;
    const doc = await db.collection("availabilityexceptions").findOne({ expertId: expertB, date: "2026-12-24" });
    expect(doc).not.toBeNull();
    expect(doc.freelancerId).toBeUndefined();

    const indexKeys = (await db.collection("availabilityexceptions").indexes()).map((i) => Object.keys(i.key).join(","));
    expect(indexKeys).toContain("expertId,date");
    expect(indexKeys.some((k) => k.includes("freelancerId"))).toBe(false);

    const second = await renameAvailabilityExpertId();
    expect(second.stats.availabilities.renamed).toBe(0);
    expect(second.stats.availabilities.droppedIndexes).toEqual([]);
  });

  test("after migrating, two experts can block the same new date", async () => {
    await renameAvailabilityExpertId();
    const AvailabilityException = require("../../modules/availability/availability-exception.model");
    await AvailabilityException.create({ expertId: expertA, date: "2027-01-01" });
    await expect(AvailabilityException.create({ expertId: expertB, date: "2027-01-01" })).resolves.toBeDefined();
    // ...but the same expert still can't block the same date twice
    await expect(AvailabilityException.create({ expertId: expertA, date: "2027-01-01" })).rejects.toThrow(/duplicate/);
  });
});
