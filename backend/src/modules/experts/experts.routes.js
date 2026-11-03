const express = require("express");
const controller = require("./experts.controller");
const { requireAuth, optionalAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.get("/", controller.listExperts);
router.get("/:id", optionalAuth, controller.getExpertById);
router.patch("/:id", requireAuth, requireRole("expert", "admin"), controller.updateExpertById);

module.exports = router;
