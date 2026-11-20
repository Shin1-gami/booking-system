
import { createClient } from "redis";

const redisUrl =
  process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = createClient({
  url: redisUrl
});

export const redisPubClient = redisClient.duplicate();
export const redisSubClient = redisClient.duplicate();

for (const [name, client] of [
  ["Redis", redisClient],
  ["Redis Pub", redisPubClient],
  ["Redis Sub", redisSubClient]
]) {
  client.on("error", (error) => {
    console.error(`Помилка ${name}:`, error);
  });
}

export async function connectRedis() {
  await Promise.all([
    redisClient.connect(),
    redisPubClient.connect(),
    redisSubClient.connect()
  ]);

  console.log("Redis успішно підключено");
}
