import { prisma } from "../config/prisma.js";
import { redisClient } from "../config/redis.js";
import { queueRedisConnection } from "../config/queueRedis.js";

export async function getHealth(req, res) {
  const services = {
    server: {
      status: "ok"
    },
    database: {
      status: "unknown"
    },
    redis: {
      status: "unknown"
    },
    queueRedis: {
      status: "unknown"
    }
  };

  // Перевірка PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`;
    services.database.status = "ok";
  } catch (error) {
    services.database.status = "error";
  }

  // Перевірка Redis для кешування та Socket.IO
  try {
    if (redisClient.isReady) {
      await redisClient.ping();
      services.redis.status = "ok";
    } else {
      services.redis.status = "error";
    }
  } catch (error) {
    services.redis.status = "error";
  }

  // Перевірка Redis для BullMQ
  try {
    if (queueRedisConnection.status === "ready") {
      await queueRedisConnection.ping();
      services.queueRedis.status = "ok";
    } else {
      services.queueRedis.status = "error";
    }
  } catch (error) {
    services.queueRedis.status = "error";
  }

  const isHealthy = Object.values(services).every(
    (service) => service.status === "ok"
  );

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services
  });
}