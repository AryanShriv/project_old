const express = require("express");
const controller = require("./availability.controller");
const exceptionsController = require("./availability.exceptions.controller");
const { requireAuth, requireRole } = require("../../middleware/auth");

const router = express.Router();

router.get("/:expertId/exceptions", requireAuth, exceptionsController.listExceptions);
router.put(
  "/:expertId/exceptions/:date",
  requireAuth,
  requireRole("expert", "admin"),
  exceptionsController.upsertException
);
router.delete(
  "/:expertId/exceptions/:date",
  requireAuth,
  requireRole("expert", "admin"),
  exceptionsController.deleteException
);

router.get("/:expertId", requireAuth, controller.getAvailability);
router.put("/:expertId", requireAuth, requireRole("expert", "admin"), controller.upsertAvailability);

module.exports = router;
