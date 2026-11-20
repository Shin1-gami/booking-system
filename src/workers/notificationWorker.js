
import { Worker } from "bullmq";

import { queueRedisConnection } from "../config/queueRedis.js";
import { prisma } from "../config/prisma.js";
import { publishUserEvent } from "../utils/eventLogger.js";

export function initializeNotificationWorker(io) {
  const worker = new Worker(
    "notifications",
    async (job) => {
      const { notificationId } = job.data;

      console.log(
        `Обробка сповіщення #${notificationId}, спроба ${job.attemptsMade + 1}`
      );

      // Отримуємо актуальні дані сповіщення з PostgreSQL
      const notification = await prisma.notification.findUnique({
        where: {
          id: notificationId
        }
      });

      if (!notification) {
        console.warn(
          `Сповіщення #${notificationId} не знайдено. Завдання пропущено.`
        );

        return {
          success: false,
          reason: "NOTIFICATION_NOT_FOUND"
        };
      }

      // Тимчасова демонстрація повторних спроб BullMQ
if (
  process.env.NOTIFICATION_RETRY_TEST === "true" &&
  job.attemptsMade < 2
) {
  throw new Error(
    "Контрольована помилка для демонстрації Retry"
  );
}



      // Доставляємо сповіщення користувачу через Socket.IO
      await publishUserEvent(
        io,
        notification.userId,
        "notification:new",
        notification
      );

      console.log(
        `Сповіщення #${notificationId} доставлено користувачу ${notification.userId}`
      );

      return {
        success: true,
        notificationId,
        userId: notification.userId
      };
    },
    {
      connection: queueRedisConnection,
      concurrency: 10
    }
  );

  worker.on("completed", (job) => {
    console.log(
      `Завдання ${job.id} успішно завершено`
    );
  });

  worker.on("failed", (job, error) => {
    console.error(
      `Помилка завдання ${job?.id}:`,
      error.message
    );
  });

  worker.on("error", (error) => {
    console.error("Помилка Notification Worker:", error);
  });

  console.log("Notification Worker запущено");

  return worker;
}
