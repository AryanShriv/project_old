const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("./user.model");
const ExpertProfile = require("../experts/expert.model");
const Application = require("../applications/application.model");
const Request = require("../requests/request.model");
const SavedExpert = require("../saved/saved.model");
const Availability = require("../availability/availability.model");
const AvailabilityException = require("../availability/availability-exception.model");
const AuditLog = require("../admin/audit-log.model");
const { sendEmail, templates } = require("../../utils/email");
const { firstNameOf } = require("../../utils/notify");

/** What other people see in place of a deleted person's name */
const FORMER_MEMBER = "Former member";

/**
 * Delete an account (App Store / Play Store requirement; Terms "Closing your account").
 *
 * Personal details are erased and the person can no longer sign in. Their email address is freed,
 * so they can sign up again later. Records other people rely on are kept but anonymised:
 * reviews they wrote and messages they sent stay visible as from a "Former member".
 * Their Terms acceptance timestamps are kept as a legal record.
 *
 * - Open requests (pending or accepted) are cancelled.
 * - Saved experts, availability and push devices are removed.
 * - An expert's public profile is taken down and anonymised; a pending application is closed.
 */
const deleteAccount = async (user) => {
  const now = new Date();
  const originalEmail = user.email;
  const firstName = firstNameOf(user.profile?.fullName);

  const profile = user.role === "expert" ? await ExpertProfile.findOne({ userId: user._id }) : null;

  // Open requests on either side are cancelled
  const requestFilter = profile
    ? { $or: [{ userId: user._id }, { expertId: profile._id }] }
    : { userId: user._id };
  await Request.updateMany(
    { ...requestFilter, status: { $in: ["pending", "accepted"] } },
    { $set: { status: "cancelled" } }
  );

  await SavedExpert.deleteMany(profile ? { $or: [{ userId: user._id }, { expertId: profile._id }] } : { userId: user._id });

  if (profile) {
    await Promise.all([
      Availability.deleteMany({ expertId: profile._id }),
      AvailabilityException.deleteMany({ expertId: profile._id }),
      Application.updateMany(
        { applicantUserId: user._id, status: "pending" },
        { $set: { status: "rejected", review: { reviewedAt: now, note: "Closed: the applicant deleted their account." } } }
      ),
    ]);
    profile.set({
      fullName: FORMER_MEMBER,
      headline: "",
      bio: "",
      avatarUrl: "",
      skills: [],
      portfolio: [],
      linkedinUrl: "",
      city: "",
      location: "",
      certifications: [],
      profileStatus: "deleted",
      isAvailable: false,
      founderBadge: false,
    });
    await profile.save();
  }

  // Erase personal details; the random password and freed email mean nobody can sign in to it again
  user.set({
    email: `deleted-${user._id}@deleted.invalid`,
    passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12),
    profile: { fullName: FORMER_MEMBER },
    accountStatus: "deleted",
    deletedAt: now,
    refreshTokenHash: null,
    pushTokens: [],
    emailVerification: undefined,
    passwordReset: undefined,
    notificationPrefs: { requestUpdates: false, newMessages: false, appUpdates: false },
  });
  await user.save();

  await AuditLog.create({
    actorId: user._id,
    action: "account_deleted",
    entityType: "user",
    entityId: user._id.toString(),
    metadata: { role: user.role, expertProfileId: profile?._id?.toString() },
  });

  // Confirmation to the address they used, sent last so it only goes out once everything worked
  await sendEmail({ to: originalEmail, ...templates.accountDeleted({ firstName }) });
};

module.exports = { deleteAccount, FORMER_MEMBER };
