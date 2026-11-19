
import "dotenv/config";
import { createServer } from "node:http";

import app from "./app.js";
import { prisma } from "./config/prisma.js";

import { initializeNotificationWorker } from "./workers/notificationWorker.js";
import { queueRedisConnection } from "./config/queueRedis.js";

import { notificationQueue } from "./queues/notificationQueue.js";

import {
  connectRedis,
  redisClient,
  redisPubClient,
  redisSubClient
} from "./config/redis.js";

import { initializeSocket } from "./socket/index.js";

const PORT = process.env.PORT || 3000;

let httpServer;
let io;
let notificationWorker;
let isShuttingDown = false;

async function closeRedisConnections() {
  const clients = [
    redisClient,
    redisPubClient,
    redisSubClient
  ];

  await Promise.all(
    clients.map(async (client) => {
      if (client.isOpen) {
        await client.quit();
      }
    })
  );
}

async function startServer() {
  try {
    // Підключення до PostgreSQL
    await prisma.$connect();

    console.log("PostgreSQL успішно підключено");

    // Підключення до Redis
    await connectRedis();

    // Створення HTTP-сервера
    httpServer = createServer(app);

    // Ініціалізація Socket.IO з Redis Adapter
    io = initializeSocket(httpServer);

    // Передаємо Socket.IO в Express-контролери
    app.set("io", io);

    // Запуск фонового обробника сповіщень
notificationWorker = initializeNotificationWorker(io);

    // Запуск сервера
    httpServer.listen(PORT, () => {
      console.log(`Сервер запущено: http://localhost:${PORT}`);
      console.log("Socket.IO готовий приймати підключення");
      console.log("Redis Adapter активовано");
      console.log("Горизонтальне масштабування WebSocket налаштовано");
    });
  } catch (error) {
    console.error("Помилка запуску сервера:", error);

    try {
  if (notificationWorker) {
    await notificationWorker.close();
  }

  await notificationQueue.close();

  if (queueRedisConnection.status !== "end") {
    await queueRedisConnection.quit();
  }

  await prisma.$disconnect();
  await closeRedisConnections();
} catch (shutdownError)  {
      console.error(
        "Помилка очищення ресурсів після невдалого запуску:",
        shutdownError
      );
    }

    process.exit(1);
  }
}

// Коректне завершення роботи сервера
async function shutdown(signal) {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log(`Отримано ${signal}. Завершення роботи сервера...`);

  try {
    // Закриття HTTP-сервера та Socket.IO
    if (io) {
      await new Promise((resolve) => {
        io.close(() => resolve());
      });
    } else if (httpServer?.listening) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    // Зупинка Worker
    if (notificationWorker) {
      await notificationWorker.close();
    }

    // Закриття черги
    await notificationQueue.close();

    // Закриття Redis для BullMQ
    if (queueRedisConnection.status !== "end") {
      await queueRedisConnection.quit();
    }

    // Відключення Prisma
    await prisma.$disconnect();

    // Закриття Redis для Socket.IO та кешування
    await closeRedisConnections();

    console.log("Усі підключення коректно закрито");

    process.exit(0);
  } catch (error) {
    console.error("Помилка завершення роботи:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
