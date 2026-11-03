const express = require("express");
const controller = require("./availability.controller");
const exceptionsController = require("./availability.exceptions.controller");
const { requireAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.get("/:freelancerId/exceptions", requireAuth, exceptionsController.listExceptions);
router.put(
  "/:freelancerId/exceptions/:date",
  requireAuth,
  requireRole("expert", "admin"),
  exceptionsController.upsertException
);
router.delete(
  "/:freelancerId/exceptions/:date",
  requireAuth,
  requireRole("expert", "admin"),
  exceptionsController.deleteException
);

router.get("/:freelancerId", requireAuth, controller.getAvailability);
router.put("/:freelancerId", requireAuth, requireRole("expert", "admin"), controller.upsertAvailability);

module.exports = router;
