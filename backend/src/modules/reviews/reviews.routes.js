const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { getExpertReviews, submitReview } = require("./reviews.controller");

const router = express.Router();

// Get reviews for an expert (publicly visible)
router.get("/:expertId", getExpertReviews);

// Submit a review: only the user who had the completed session (checked in the controller)
router.post("/:expertId", requireAuth, requireRole("user"), submitReview);

module.exports = router;
