const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { migrateUserRoles } = require("../terminology-refactor");

let mongoServer;

describe("Terminology Refactor Migration - User Roles", () => {
  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear the users collection before each test
    await mongoose.connection.db.collection("users").deleteMany({});
  });

  test("should update all user roles from 'freelancer' to 'expert'", async () => {
    const User = mongoose.connection.db.collection("users");

    // Insert test data with freelancer roles
    await User.insertMany([
      { email: "freelancer1@example.com", role: "freelancer", passwordHash: "hash1" },
      { email: "freelancer2@example.com", role: "freelancer", passwordHash: "hash2" },
      { email: "freelancer3@example.com", role: "freelancer", passwordHash: "hash3" },
    ]);

    // Run migration
    const result = await migrateUserRoles();

    // Verify migration success
    expect(result.success).toBe(true);
    expect(result.stats.freelancerToExpert).toBe(3);

    // Verify no freelancer roles remain
    const freelancerCount = await User.countDocuments({ role: "freelancer" });
    expect(freelancerCount).toBe(0);

    // Verify expert roles were created
    const expertCount = await User.countDocuments({ role: "expert" });
    expect(expertCount).toBe(3);
  });

  test("should update all user roles from 'client' to 'user'", async () => {
    const User = mongoose.connection.db.collection("users");

    // Insert test data with client roles
    await User.insertMany([
      { email: "client1@example.com", role: "client", passwordHash: "hash1" },
      { email: "client2@example.com", role: "client", passwordHash: "hash2" },
      { email: "client3@example.com", role: "client", passwordHash: "hash3" },
      { email: "client4@example.com", role: "client", passwordHash: "hash4" },
    ]);

    // Run migration
    const result = await migrateUserRoles();

    // Verify migration success
    expect(result.success).toBe(true);
    expect(result.stats.clientToUser).toBe(4);

    // Verify no client roles remain
    const clientCount = await User.countDocuments({ role: "client" });
    expect(clientCount).toBe(0);

    // Verify user roles were created
    const userCount = await User.countDocuments({ role: "user" });
    expect(userCount).toBe(4);
  });

  test("should preserve admin roles unchanged", async () => {
    const User = mongoose.connection.db.collection("users");

    // Insert test data with admin roles
    await User.insertMany([
      { email: "admin1@example.com", role: "admin", passwordHash: "hash1" },
      { email: "admin2@example.com", role: "admin", passwordHash: "hash2" },
    ]);

    const beforeCount = await User.countDocuments({ role: "admin" });

    // Run migration
    const result = await migrateUserRoles();

    // Verify migration success
    expect(result.success).toBe(true);
    expect(result.stats.adminPreserved).toBe(2);

    // Verify admin count unchanged
    const afterCount = await User.countDocuments({ role: "admin" });
    expect(afterCount).toBe(beforeCount);
    expect(afterCount).toBe(2);

    // Verify admin documents still have admin role
    const admins = await User.find({ role: "admin" }).toArray();
    expect(admins).toHaveLength(2);
    expect(admins[0].role).toBe("admin");
    expect(admins[1].role).toBe("admin");
  });

  test("should handle mixed roles in a single migration", async () => {
    const User = mongoose.connection.db.collection("users");

    // Insert test data with mixed roles
    await User.insertMany([
      { email: "freelancer1@example.com", role: "freelancer", passwordHash: "hash1" },
      { email: "freelancer2@example.com", role: "freelancer", passwordHash: "hash2" },
      { email: "client1@example.com", role: "client", passwordHash: "hash3" },
      { email: "client2@example.com", role: "client", passwordHash: "hash4" },
      { email: "client3@example.com", role: "client", passwordHash: "hash5" },
      { email: "admin1@example.com", role: "admin", passwordHash: "hash6" },
    ]);

    // Run migration
    const result = await migrateUserRoles();

    // Verify migration success
    expect(result.success).toBe(true);
    expect(result.stats.freelancerToExpert).toBe(2);
    expect(result.stats.clientToUser).toBe(3);
    expect(result.stats.adminPreserved).toBe(1);

    // Verify final state
    const expertCount = await User.countDocuments({ role: "expert" });
    const userCount = await User.countDocuments({ role: "user" });
    const adminCount = await User.countDocuments({ role: "admin" });
    const freelancerCount = await User.countDocuments({ role: "freelancer" });
    const clientCount = await User.countDocuments({ role: "client" });

    expect(expertCount).toBe(2);
    expect(userCount).toBe(3);
    expect(adminCount).toBe(1);
    expect(freelancerCount).toBe(0);
    expect(clientCount).toBe(0);
  });

  test("should log count of updated documents after migration", async () => {
    const User = mongoose.connection.db.collection("users");

    // Insert test data
    await User.insertMany([
      { email: "freelancer1@example.com", role: "freelancer", passwordHash: "hash1" },
      { email: "client1@example.com", role: "client", passwordHash: "hash2" },
    ]);

    // Run migration
    const result = await migrateUserRoles();

    // Verify stats are returned and logged
    expect(result.success).toBe(true);
    expect(result.stats).toBeDefined();
    expect(result.stats.freelancerToExpert).toBe(1);
    expect(result.stats.clientToUser).toBe(1);
    expect(result.stats.adminPreserved).toBe(0);
  });

  test("should handle empty users collection gracefully", async () => {
    // Run migration on empty collection
    const result = await migrateUserRoles();

    // Verify migration success with zero updates
    expect(result.success).toBe(true);
    expect(result.stats.freelancerToExpert).toBe(0);
    expect(result.stats.clientToUser).toBe(0);
    expect(result.stats.adminPreserved).toBe(0);
  });

  test("should handle collection with only new role values", async () => {
    const User = mongoose.connection.db.collection("users");

    // Insert test data with already migrated roles
    await User.insertMany([
      { email: "expert1@example.com", role: "expert", passwordHash: "hash1" },
      { email: "user1@example.com", role: "user", passwordHash: "hash2" },
      { email: "admin1@example.com", role: "admin", passwordHash: "hash3" },
    ]);

    // Run migration (should be idempotent)
    const result = await migrateUserRoles();

    // Verify migration success with zero updates
    expect(result.success).toBe(true);
    expect(result.stats.freelancerToExpert).toBe(0);
    expect(result.stats.clientToUser).toBe(0);
    expect(result.stats.adminPreserved).toBe(1);

    // Verify roles remain unchanged
    const expertCount = await User.countDocuments({ role: "expert" });
    const userCount = await User.countDocuments({ role: "user" });
    const adminCount = await User.countDocuments({ role: "admin" });

    expect(expertCount).toBe(1);
    expect(userCount).toBe(1);
    expect(adminCount).toBe(1);
  });
});
