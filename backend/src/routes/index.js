const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/users/users.routes");
const freelancerRoutes = require("../modules/freelancers/freelancers.routes");
const requestRoutes = require("../modules/requests/requests.routes");
const savedRoutes = require("../modules/saved/saved.routes");
const adminRoutes = require("../modules/admin/admin.routes");
const applicationRoutes = require("../modules/applications/applications.routes");
const notificationRoutes = require("../modules/notifications/notifications.routes");
const availabilityRoutes = require("../modules/availability/availability.routes");
const { sendSuccess } = require("../utils/http");

const router = express.Router();

router.get("/health", (req, res) => sendSuccess(res, { status: "up" }));
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/freelancers", freelancerRoutes);
router.use("/requests", requestRoutes);
router.use("/saved", savedRoutes);
router.use("/admin", adminRoutes);
router.use("/applications", applicationRoutes);
router.use("/notifications", notificationRoutes);
router.use("/availability", availabilityRoutes);

module.exports = router;
