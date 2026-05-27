const mongoose = require("mongoose");
const FreelancerProfile = require("../freelancers/freelancer.model");

const assertFreelancerAccess = async (freelancerId, auth) => {
  if (!mongoose.isValidObjectId(freelancerId)) {
    return { ok: false, status: 400, message: "Invalid freelancer id" };
  }

  const profile = await FreelancerProfile.findById(freelancerId).select("userId");
  if (!profile) {
    return { ok: false, status: 404, message: "Freelancer not found" };
  }

  if (auth.role === "freelancer" && profile.userId.toString() !== auth.sub) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: true, profile };
};

module.exports = { assertFreelancerAccess };
