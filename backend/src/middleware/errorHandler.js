const { sendError } = require("../utils/http");

const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";
  const details = err.details || undefined;
  return sendError(res, message, status, details);
};

module.exports = { errorHandler };
