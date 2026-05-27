const express = require("express");
const controller = require("./applications.controller");
const { requireAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.post("/freelancer", requireAuth, requireRole("freelancer"), controller.createFreelancerApplication);

module.exports = router;
