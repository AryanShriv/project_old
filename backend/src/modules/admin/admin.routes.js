const express = require("express");
const controller = require("./admin.controller");
const reviews = require("../reviews/reviews.controller");
const { requireAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.get("/applications", requireAuth, requireRole("admin"), controller.listApplications);
router.patch("/applications/:id", requireAuth, requireRole("admin"), controller.reviewApplication);
router.patch("/experts/:id/status", requireAuth, requireRole("admin"), controller.setExpertStatus);
router.get("/reviews", requireAuth, requireRole("admin"), reviews.listReviewsForAdmin);
router.patch("/reviews/:id/visibility", requireAuth, requireRole("admin"), reviews.setReviewVisibility);
router.get("/audit-logs", requireAuth, requireRole("admin"), controller.listAuditLogs);

module.exports = router;
