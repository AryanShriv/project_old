const express = require("express");
const controller = require("./admin.controller");
const { requireAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.get("/applications", requireAuth, requireRole("admin"), controller.listApplications);
router.patch("/applications/:id", requireAuth, requireRole("admin"), controller.reviewApplication);
router.patch("/freelancers/:id/status", requireAuth, requireRole("admin"), controller.setFreelancerStatus);
router.get("/audit-logs", requireAuth, requireRole("admin"), controller.listAuditLogs);

module.exports = router;
