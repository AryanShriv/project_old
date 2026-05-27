const express = require("express");
const controller = require("./requests.controller");
const { requireAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, requireRole("client"), controller.createRequest);
router.get("/", requireAuth, controller.listRequests);
router.patch("/:id/status", requireAuth, requireRole("client", "freelancer", "admin"), controller.updateRequestStatus);

module.exports = router;
