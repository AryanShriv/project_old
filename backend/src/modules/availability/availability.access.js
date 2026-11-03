const mongoose = require("mongoose");
const FreelancerProfile = require("../experts/expert.model");

const assertFreelancerAccess = async (freelancerId, auth) => {
  if (!mongoose.isValidObjectId(freelancerId)) {
    return { ok: false, status: 400, message: "Invalid expert id" };
  }

  const profile = await FreelancerProfile.findById(freelancerId).select("userId");
  if (!profile) {
    return { ok: false, status: 404, message: "Expert not found" };
  }

  if (auth.role === "expert" && profile.userId.toString() !== auth.sub) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: true, profile };
};

module.exports = { assertFreelancerAccess };
