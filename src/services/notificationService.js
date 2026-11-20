
import { prisma } from "../config/prisma.js";
import {
  enqueueNotification,
  enqueueNotifications
} from "../queues/notificationQueue.js";

// Створення одного сповіщення
export async function createNotification(data) {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      message: data.message,
      priority: data.priority ?? "NORMAL"
    }
  });

  try {
    await enqueueNotification(notification);
  } catch (error) {
    console.error(
      `Не вдалося додати сповіщення ${notification.id} до черги:`,
      error
    );

    throw error;
  }

  return notification;
}

// Пакетне створення сповіщень
export async function createNotificationsBatch(notificationsData) {
  if (
    !Array.isArray(notificationsData) ||
    notificationsData.length === 0
  ) {
    throw new Error("Список сповіщень порожній");
  }

  // Спочатку зберігаємо всі записи в PostgreSQL
  const notifications = await prisma.$transaction(
    notificationsData.map((data) =>
      prisma.notification.create({
        data: {
          userId: data.userId,
          message: data.message,
          priority: data.priority ?? "NORMAL"
        }
      })
    )
  );

  // Потім пакетно додаємо їх у BullMQ
  try {
    await enqueueNotifications(notifications);
  } catch (error) {
    console.error(
      "Помилка пакетного додавання сповіщень до черги:",
      error
    );

    throw error;
  }

  return notifications;
}
