const express = require("express");
const controller = require("./users.controller");
const { requireAuth } = require("../../middleware/auth");

const router = express.Router();

router.get("/me", requireAuth, controller.getMe);
router.patch("/me", requireAuth, controller.updateMe);

module.exports = router;
