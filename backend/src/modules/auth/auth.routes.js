const express = require("express");
const controller = require("./auth.controller");
const { requireAuth } = require("../../middleware/auth");

const router = express.Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", requireAuth, controller.logout);
router.get("/me", requireAuth, controller.me);
router.post("/verify-email/send", requireAuth, controller.sendVerificationCode);
router.post("/verify-email", requireAuth, controller.verifyEmail);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

module.exports = router;
