const express = require("express");
const controller = require("./freelancers.controller");
const { requireAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.get("/", controller.listFreelancers);
router.get("/:id", controller.getFreelancerById);
router.patch("/:id", requireAuth, requireRole("freelancer", "admin"), controller.updateFreelancerById);

module.exports = router;
