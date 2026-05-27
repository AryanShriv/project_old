const bcrypt = require("bcryptjs");
const env = require("./env");
const User = require("../modules/users/user.model");

const ensureAdminUser = async () => {
  if (!env.adminEmail || !env.adminPassword) {
    // eslint-disable-next-line no-console
    console.warn("ADMIN_EMAIL or ADMIN_PASSWORD is not set. Admin auto-seed skipped.");
    return;
  }

  const normalizedEmail = env.adminEmail.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  const nextPasswordHash = await bcrypt.hash(env.adminPassword, 12);

  if (!existing) {
    await User.create({
      email: normalizedEmail,
      passwordHash: nextPasswordHash,
      role: "admin",
      accountStatus: "active",
      profile: { fullName: env.adminName },
    });
    // eslint-disable-next-line no-console
    console.log(`Seeded admin user: ${normalizedEmail}`);
    return;
  }

  const needsRoleFix = existing.role !== "admin";
  const isPasswordMatch = await bcrypt.compare(env.adminPassword, existing.passwordHash);
  const needsPasswordUpdate = !isPasswordMatch;
  const needsStatusFix = existing.accountStatus !== "active";

  if (needsRoleFix || needsPasswordUpdate || needsStatusFix) {
    existing.role = "admin";
    existing.accountStatus = "active";
    existing.passwordHash = nextPasswordHash;
    existing.profile = {
      ...existing.profile,
      fullName: existing.profile?.fullName || env.adminName,
    };
    await existing.save();
    // eslint-disable-next-line no-console
    console.log(`Updated admin user credentials: ${normalizedEmail}`);
  }
};

module.exports = { ensureAdminUser };
