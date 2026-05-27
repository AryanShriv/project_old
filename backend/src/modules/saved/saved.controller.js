const mongoose = require("mongoose");
const { sendSuccess, sendError } = require("../../utils/http");
const SavedFreelancer = require("./saved.model");
const FreelancerProfile = require("../freelancers/freelancer.model");

const listSavedFreelancers = async (req, res) => {
  const userId = req.auth.sub;

  const records = await SavedFreelancer.find({ userId })
    .sort({ createdAt: -1 })
    .populate({
      path: "freelancerId",
      select:
        "fullName headline avatarUrl skills categories hourlyRate currency yearsExperience location responseTime isAvailable profileStatus rating completedProjects",
    })
    .lean();

  const items = records
    .filter((record) => Boolean(record.freelancerId))
    .map((record) => ({
      id: record._id.toString(),
      savedAt: record.createdAt,
      freelancer: record.freelancerId,
    }));

  return sendSuccess(res, { items, total: items.length }, "Saved freelancers fetched");
};

const saveFreelancer = async (req, res) => {
  const userId = req.auth.sub;
  const { freelancerId } = req.params;

  if (!mongoose.isValidObjectId(freelancerId)) {
    return sendError(res, "Invalid freelancer id", 400);
  }

  const freelancer = await FreelancerProfile.findById(freelancerId).select("_id profileStatus");
  if (!freelancer || freelancer.profileStatus !== "active") {
    return sendError(res, "Freelancer not available", 404);
  }

  const existing = await SavedFreelancer.findOne({ userId, freelancerId });
  if (existing) {
    return sendSuccess(
      res,
      { id: existing._id.toString(), freelancerId, alreadySaved: true },
      "Freelancer already saved"
    );
  }

  const created = await SavedFreelancer.create({ userId, freelancerId });
  return sendSuccess(
    res,
    { id: created._id.toString(), freelancerId: created.freelancerId.toString() },
    "Freelancer saved",
    201
  );
};

const unsaveFreelancer = async (req, res) => {
  const userId = req.auth.sub;
  const { freelancerId } = req.params;

  if (!mongoose.isValidObjectId(freelancerId)) {
    return sendError(res, "Invalid freelancer id", 400);
  }

  const result = await SavedFreelancer.findOneAndDelete({ userId, freelancerId });
  if (!result) {
    return sendError(res, "Saved item not found", 404);
  }

  return sendSuccess(res, { freelancerId }, "Freelancer unsaved");
};

module.exports = { listSavedFreelancers, saveFreelancer, unsaveFreelancer };
