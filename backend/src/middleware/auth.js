const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { sendError } = require("../utils/http");

const requireAuth = (req, res, next) => {
  if (!env.jwtAccessSecret) {
    return sendError(res, "Server JWT secret not configured", 500);
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return sendError(res, "Unauthorized", 401);
  }

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.auth = payload;
    return next();
  } catch (error) {
    return sendError(res, "Invalid or expired token", 401);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  const userRole = req.auth?.role;
  if (!userRole || !roles.includes(userRole)) {
    return sendError(res, "Forbidden", 403);
  }
  return next();
};

module.exports = { requireAuth, requireRole };
