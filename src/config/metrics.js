import client from "prom-client";

export const register = new client.Registry();

register.setDefaultLabels({
  app: "booking-system"
});

// Збір стандартних метрик Node.js
client.collectDefaultMetrics({
  register,
  prefix: "booking_"
});

// Загальна кількість HTTP-запитів
export const httpRequestsTotal = new client.Counter({
  name: "booking_http_requests_total",
  help: "Загальна кількість HTTP-запитів",
  labelNames: ["method", "route", "status_code"],
  registers: [register]
});

// Тривалість HTTP-запитів
export const httpRequestDuration = new client.Histogram({
  name: "booking_http_request_duration_seconds",
  help: "Тривалість обробки HTTP-запитів у секундах",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

// Кількість HTTP-помилок
export const httpErrorsTotal = new client.Counter({
  name: "booking_http_errors_total",
  help: "Кількість HTTP-помилок",
  labelNames: ["method", "route", "status_code"],
  registers: [register]
});