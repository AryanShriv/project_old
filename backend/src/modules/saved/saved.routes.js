const express = require("express");
const controller = require("./saved.controller");
const { requireAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireRole("client"), controller.listSavedFreelancers);
router.post("/:freelancerId", requireAuth, requireRole("client"), controller.saveFreelancer);
router.delete("/:freelancerId", requireAuth, requireRole("client"), controller.unsaveFreelancer);

module.exports = router;
