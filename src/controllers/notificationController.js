import { prisma } from "../config/prisma.js";

// Отримати сповіщення користувача
export async function getNotifications(req, res, next) {
  try {
    const userId = Number(req.query.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: "Необхідно вказати коректний userId"
      });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

// Створити сповіщення
export async function createNotification(req, res, next) {
  try {
    const notification = await prisma.notification.create({
      data: req.body
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

    const notification = await prisma.notification.update({
      where: { id },
      data: req.body
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