const express = require("express");
const controller = require("./experts.controller");
const { requireAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.get("/", controller.listExperts);
router.get("/:id", controller.getExpertById);
router.patch("/:id", requireAuth, requireRole("expert", "admin"), controller.updateExpertById);

module.exports = router;
