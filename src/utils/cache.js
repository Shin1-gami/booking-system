import { redisClient } from "../config/redis.js";

const DEFAULT_TTL = 60;

// Отримання даних із кешу
export async function getCache(key) {
  try {
    if (!redisClient.isReady) {
      return null;
    }

    const cachedData = await redisClient.get(key);

    if (!cachedData) {
      return null;
    }

    return JSON.parse(cachedData);
  } catch (error) {
    console.error("Помилка читання Redis-кешу:", error);
    return null;
  }
}

// Збереження даних у кеші
export async function setCache(key, data, ttl = DEFAULT_TTL) {
  try {
    if (!redisClient.isReady) {
      return;
    }

    await redisClient.setEx(
      key,
      ttl,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error("Помилка запису Redis-кешу:", error);
  }
}

// Отримання версії кешу
export async function getCacheVersion(namespace) {
  const key = `cache:${namespace}:version`;

  try {
    if (!redisClient.isReady) {
      return "0";
    }

    return (await redisClient.get(key)) ?? "0";
  } catch (error) {
    console.error("Помилка отримання версії кешу:", error);
    return "0";
  }
}

// Інвалідація кешу через зміну версії
export async function invalidateCache(namespace) {
  try {
    if (!redisClient.isReady) {
      return;
    }

    await redisClient.incr(`cache:${namespace}:version`);
  } catch (error) {
    console.error("Помилка інвалідації кешу:", error);
  }
}