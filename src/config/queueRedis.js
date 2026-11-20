
import IORedis from "ioredis";

const redisUrl =
  process.env.REDIS_URL || "redis://localhost:6379";

export const queueRedisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

queueRedisConnection.on("error", (error) => {
  console.error("Помилка Redis для черги:", error);
});

queueRedisConnection.on("connect", () => {
  console.log("Redis для BullMQ підключено");
});
