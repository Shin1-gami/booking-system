import { register } from "../config/metrics.js";

export async function getMetrics(req, res, next) {
  try {
    res.set("Content-Type", register.contentType);

    const metrics = await register.metrics();

    res.end(metrics);
  } catch (error) {
    next(error);
  }
}