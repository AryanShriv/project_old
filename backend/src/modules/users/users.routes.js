const express = require("express");
const controller = require("./users.controller");
const { requireAuth } = require("../../middleware/auth");

const router = express.Router();

router.get("/me", requireAuth, controller.getMe);
router.patch("/me", requireAuth, controller.updateMe);
router.get("/me/notification-prefs", requireAuth, controller.getNotificationPrefs);
router.patch("/me/notification-prefs", requireAuth, controller.updateNotificationPrefs);

module.exports = router;
