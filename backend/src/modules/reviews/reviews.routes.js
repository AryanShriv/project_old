const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const { getExpertReviews, submitReview } = require("./reviews.controller");

const router = express.Router();

// Get reviews for an expert (publicly visible)
router.get("/:expertId", getExpertReviews);

// Submit a review for an expert (requires authentication)
router.post("/:expertId", requireAuth, submitReview);

module.exports = router;
