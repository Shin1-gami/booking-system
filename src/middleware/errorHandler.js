import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;

  logger.error({
    err,
    method: req.method,
    url: req.originalUrl,
    requestId: req.id
  }, "Помилка обробки запиту");

  if (res.headersSent) {
    return next(err);
  }

  const isProduction = process.env.NODE_ENV === "production";

  return res.status(statusCode).json({
    success: false,
    message:
      isProduction && statusCode >= 500
        ? "Внутрішня помилка сервера"
        : err.message || "Сталася помилка сервера",
    ...(isProduction ? {} : { stack: err.stack }),
    requestId: req.id || null
  });
}