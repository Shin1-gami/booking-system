
import { prisma } from "../config/prisma.js";
import { publishUserEvent } from "../utils/eventLogger.js";
import { createNotification as createNotificationService, createNotificationsBatch } from "../services/notificationService.js";

// Надсилання подій сповіщень конкретному користувачу
async function emitNotificationEvent(req, userId, event, data) {
  const io = req.app.get("io");

  await publishUserEvent(
    io,
    userId,
    event,
    data
  );
}

// Перевірка коректності ID
function validateNotificationId(id) {
  return Number.isInteger(id) && id > 0;
}

// Перевірка ролі адміністратора
function isAdmin(req) {
  return req.user.role === "ADMIN";
}

// Отримати сповіщення
export async function getNotifications(req, res, next) {
  try {
    let where = {};

    if (isAdmin(req)) {
      // Адміністратор може переглядати всі сповіщення
      // або фільтрувати їх за ID користувача
      if (req.query.userId !== undefined) {
        const userId = Number(req.query.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
          return res.status(400).json({
            message: "Некоректний userId"
          });
        }

        where.userId = userId;
      }
    } else {
      // Звичайний користувач бачить лише власні сповіщення
      where.userId = req.user.userId;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

// Створити сповіщення

export async function createNotification(req, res, next) {
  try {
    const { userId, message, priority } = req.body;

    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({
        message: "Некоректні дані сповіщення"
      });
    }

    const allowedPriorities = [
      "LOW",
      "NORMAL",
      "HIGH",
      "URGENT"
    ];

    if (
      priority !== undefined &&
      !allowedPriorities.includes(priority)
    ) {
      return res.status(400).json({
        message: "Некоректний пріоритет сповіщення"
      });
    }

    const notification = await createNotificationService({
      userId,
      message: message.trim(),
      priority
    });

    res.status(201).json({
      message: "Сповіщення створено та додано до черги",
      data: notification
    });
  } catch (error) {
    next(error);
  }
}


// Оновити сповіщення
export async function updateNotification(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!validateNotificationId(id)) {
      return res.status(400).json({
        message: "Некоректний ID сповіщення"
      });
    }

    const existingNotification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!existingNotification) {
      return res.status(404).json({
        message: "Сповіщення не знайдено"
      });
    }

    // Користувач може змінювати лише власні сповіщення
    if (
      !isAdmin(req) &&
      existingNotification.userId !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Ви не можете змінювати чуже сповіщення"
      });
    }

    // Користувач може лише позначити сповіщення прочитаним
    if (!isAdmin(req) && req.body.message !== undefined) {
      return res.status(403).json({
        message: "Змінювати текст сповіщення може лише адміністратор"
      });
    }

    const data = {};

    if (isAdmin(req) && req.body.message !== undefined) {
      data.message = req.body.message;
    }

    if (req.body.isRead !== undefined) {
      data.isRead = req.body.isRead;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "Немає даних для оновлення"
      });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data
    });

    // Повідомляємо користувача про зміну сповіщення
    await emitNotificationEvent(
      req,
      notification.userId,
      "notification:updated",
    notification
    );

    res.json(notification);
  } catch (error) {
    next(error);
  }
}

// Видалити сповіщення
export async function deleteNotification(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!validateNotificationId(id)) {
      return res.status(400).json({
        message: "Некоректний ID сповіщення"
      });
    }

    const existingNotification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!existingNotification) {
      return res.status(404).json({
        message: "Сповіщення не знайдено"
      });
    }

    if (
      !isAdmin(req) &&
      existingNotification.userId !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Ви не можете видаляти чуже сповіщення"
      });
    }

    await prisma.notification.delete({
      where: { id }
    });

    // Повідомляємо користувача про видалення сповіщення
    await emitNotificationEvent(
      req,
      existingNotification.userId,
      "notification:deleted",
      {
        id: existingNotification.id,
        userId: existingNotification.userId
      }
    );

    res.json({
      message: "Сповіщення успішно видалено"
    });
  } catch (error) {
    next(error);
  }
}

// Пакетне створення сповіщень
export async function createNotificationsBatchController(req, res, next) {
  try {
    const { notifications } = req.body;

    const allowedPriorities = [
      "LOW",
      "NORMAL",
      "HIGH",
      "URGENT"
    ];

    // Перевірка масиву
    if (
      !Array.isArray(notifications) ||
      notifications.length === 0 ||
      notifications.length > 100
    ) {
      return res.status(400).json({
        message: "Потрібно передати від 1 до 100 сповіщень"
      });
    }

    // Перевірка кожного сповіщення
    const invalidNotification = notifications.find((item) => {
      return (
        !item ||
        !Number.isInteger(item.userId) ||
        item.userId <= 0 ||
        typeof item.message !== "string" ||
        item.message.trim().length === 0 ||
        (
          item.priority !== undefined &&
          !allowedPriorities.includes(item.priority)
        )
      );
    });

    if (invalidNotification) {
      return res.status(400).json({
        message: "Одне або декілька сповіщень містять некоректні дані"
      });
    }

    const normalizedNotifications = notifications.map((item) => ({
      userId: item.userId,
      message: item.message.trim(),
      priority: item.priority ?? "NORMAL"
    }));

    const createdNotifications =
      await createNotificationsBatch(normalizedNotifications);

    return res.status(201).json({
      message: "Пакет сповіщень успішно створено та додано до черги",
      count: createdNotifications.length,
      data: createdNotifications
    });
  } catch (error) {
    next(error);
  }
}
