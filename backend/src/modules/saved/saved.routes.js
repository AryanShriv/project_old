const express = require("express");
const controller = require("./saved.controller");
const { requireAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireRole("user"), controller.listSavedExperts);
router.post("/:expertId", requireAuth, requireRole("user"), controller.saveExpert);
router.delete("/:expertId", requireAuth, requireRole("user"), controller.unsaveExpert);

module.exports = router;
