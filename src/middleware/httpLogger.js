import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";

export const httpLogger = pinoHttp({
  logger,

  genReqId(req, res) {
    const requestId = randomUUID();
    res.setHeader("X-Request-Id", requestId);
    return requestId;
  },

  customLogLevel(req, res, error) {
    if (error || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },

  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} завершено`;
  },

  customErrorMessage(req, res, error) {
    return `${req.method} ${req.url} завершено з помилкою: ${error.message}`;
  },

  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress
      };
    },

    res(res) {
      return {
        statusCode: res.statusCode
      };
    }
  }
});