const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/users/users.routes");
const expertRoutes = require("../modules/experts/experts.routes");
const requestRoutes = require("../modules/requests/requests.routes");
const savedRoutes = require("../modules/saved/saved.routes");
const adminRoutes = require("../modules/admin/admin.routes");
const applicationRoutes = require("../modules/applications/applications.routes");
const notificationRoutes = require("../modules/notifications/notifications.routes");
const availabilityRoutes = require("../modules/availability/availability.routes");
const chatRoutes = require("../modules/chat/chat.routes");
const reviewRoutes = require("../modules/reviews/reviews.routes");
const { sendSuccess } = require("../utils/http");

const router = express.Router();

router.get("/health", (req, res) => sendSuccess(res, { status: "up" }));
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/experts", expertRoutes);
router.use("/requests", requestRoutes);
router.use("/saved", savedRoutes);
router.use("/admin", adminRoutes);
router.use("/applications", applicationRoutes);
router.use("/notifications", notificationRoutes);
router.use("/availability", availabilityRoutes);
router.use("/chat", chatRoutes);
router.use("/reviews", reviewRoutes);

// Backward compatibility layer: redirect deprecated /freelancers endpoints to /experts
router.use("/freelancers", (req, res) => {
  const newPath = req.originalUrl.replace('/freelancers', '/experts');
  
  // Log deprecated endpoint usage for monitoring
  // eslint-disable-next-line no-console
  console.warn(`[DEPRECATED] Legacy endpoint accessed: ${req.method} ${req.originalUrl} -> redirecting to ${newPath}`);
  
  // Set deprecation header
  res.set('X-API-Deprecation', 'This endpoint is deprecated. Use /api/v1/experts instead');
  
  // Return HTTP 301 Moved Permanently redirect
  return res.redirect(301, newPath);
});

module.exports = router;
