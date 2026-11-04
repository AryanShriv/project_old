const mongoose = require("mongoose");
const ExpertProfile = require("../experts/expert.model");

const assertExpertAccess = async (expertId, auth) => {
  if (!mongoose.isValidObjectId(expertId)) {
    return { ok: false, status: 400, message: "Invalid expert id" };
  }

  const profile = await ExpertProfile.findById(expertId).select("userId");
  if (!profile) {
    return { ok: false, status: 404, message: "Expert not found" };
  }

  if (auth.role === "expert" && profile.userId.toString() !== auth.sub) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: true, profile };
};

module.exports = { assertExpertAccess };
