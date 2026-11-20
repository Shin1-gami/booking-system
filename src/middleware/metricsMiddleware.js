import {
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal
} from "../config/metrics.js";

export function metricsMiddleware(req, res, next) {
  // Не враховуємо сам запит Prometheus
  if (req.path === "/metrics") {
    return next();
  }

  const startTime = process.hrtime.bigint();

  res.on("finish", () => {
    const duration =
      Number(process.hrtime.bigint() - startTime) / 1e9;

    // Використовуємо шаблон маршруту, а не конкретний URL з ID
    const route = req.route
      ? `${req.baseUrl}${req.route.path}`
      : "unmatched";

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode)
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);

    if (res.statusCode >= 400) {
      httpErrorsTotal.inc(labels);
    }
  });

  next();
}