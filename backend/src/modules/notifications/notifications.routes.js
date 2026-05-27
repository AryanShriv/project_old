const express = require("express");
const controller = require("./notifications.controller");
const { requireAuth } = require("../../middleware/auth");

const router = express.Router();

router.post("/device-token", requireAuth, controller.registerDeviceToken);
router.delete("/device-token", requireAuth, controller.removeDeviceToken);
router.get("/", requireAuth, controller.listNotifications);

module.exports = router;
