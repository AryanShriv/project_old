const mongoose = require("mongoose");
const { sendSuccess, sendError } = require("../../utils/http");
const SavedExpert = require("./saved.model");
const ExpertProfile = require("../experts/expert.model");

const listSavedExperts = async (req, res) => {
  const userId = req.auth.sub;

  const records = await SavedExpert.find({ userId })
    .sort({ createdAt: -1 })
    .populate({
      path: "expertId",
      select:
        "fullName headline avatarUrl skills categories hourlyRate currency yearsExperience location responseTime isAvailable profileStatus rating completedProjects",
    })
    .lean();

  const items = records
    .filter((record) => Boolean(record.expertId))
    .map((record) => ({
      id: record._id.toString(),
      savedAt: record.createdAt,
      expert: record.expertId,
    }));

  return sendSuccess(res, { items, total: items.length }, "Saved experts fetched");
};

const saveExpert = async (req, res) => {
  const userId = req.auth.sub;
  const { expertId } = req.params;

  if (!mongoose.isValidObjectId(expertId)) {
    return sendError(res, "Invalid expert id", 400);
  }

  const expert = await ExpertProfile.findById(expertId).select("_id profileStatus");
  if (!expert || expert.profileStatus !== "active") {
    return sendError(res, "Expert not available", 404);
  }

  const existing = await SavedExpert.findOne({ userId, expertId });
  if (existing) {
    return sendSuccess(
      res,
      { id: existing._id.toString(), expertId, alreadySaved: true },
      "Expert already saved"
    );
  }

  const created = await SavedExpert.create({ userId, expertId });
  return sendSuccess(
    res,
    { id: created._id.toString(), expertId: created.expertId.toString() },
    "Expert saved",
    201
  );
};

const unsaveExpert = async (req, res) => {
  const userId = req.auth.sub;
  const { expertId } = req.params;

  if (!mongoose.isValidObjectId(expertId)) {
    return sendError(res, "Invalid expert id", 400);
  }

  const result = await SavedExpert.findOneAndDelete({ userId, expertId });
  if (!result) {
    return sendError(res, "Saved item not found", 404);
  }

  return sendSuccess(res, { expertId }, "Expert unsaved");
};

module.exports = { listSavedExperts, saveExpert, unsaveExpert };
