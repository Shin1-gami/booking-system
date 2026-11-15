
import { prisma } from "../config/prisma.js";

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
    const { userId, message } = req.body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        message
      }
    });

    res.status(201).json(notification);
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

    res.json({
      message: "Сповіщення успішно видалено"
    });
  } catch (error) {
    next(error);
  }
}
