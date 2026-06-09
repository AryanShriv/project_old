const express = require("express");
const controller = require("./chat.controller");
const { requireAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.get("/conversations", requireAuth, controller.listConversations);
router.get("/conversations/:id/messages", requireAuth, controller.getMessages);
router.post("/conversations/:id/read", requireAuth, controller.markAsRead);

// Admin monitoring
router.get("/admin/conversations", requireAuth, requireRole("admin"), controller.adminListConversations);
router.get("/admin/conversations/:id/messages", requireAuth, requireRole("admin"), controller.getMessages);

module.exports = router;
