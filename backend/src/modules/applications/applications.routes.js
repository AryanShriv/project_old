const express = require("express");
const controller = require("./applications.controller");
const { requireAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.post("/expert", requireAuth, requireRole("expert"), controller.createExpertApplication);

module.exports = router;
