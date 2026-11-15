
import { prisma } from "../config/prisma.js";

// Перевірка коректності ID ресурсу
function validateResourceId(id) {
  return Number.isInteger(id) && id > 0;
}

// Отримати обрані ресурси користувача
export async function getFavorites(req, res, next) {
  try {
    const userId = req.user.userId;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        resource: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(favorites);
  } catch (error) {
    next(error);
  }
}

// Додати ресурс до обраного
export async function createFavorite(req, res, next) {
  try {
    const userId = req.user.userId;
    const { resourceId } = req.body;

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        resourceId
      },
      include: {
        resource: true
      }
    });

    res.status(201).json({
      message: "Ресурс успішно додано до обраного",
      favorite
    });
  } catch (error) {
    next(error);
  }
}

// Видалити ресурс з обраного
export async function deleteFavorite(req, res, next) {
  try {
    const userId = req.user.userId;
    const resourceId = Number(req.params.resourceId);

    if (!validateResourceId(resourceId)) {
      return res.status(400).json({
        message: "Некоректний ID ресурсу"
      });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_resourceId: {
          userId,
          resourceId
        }
      }
    });

    if (!favorite) {
      return res.status(404).json({
        message: "Ресурс не знайдено в обраному"
      });
    }

    await prisma.favorite.delete({
      where: {
        userId_resourceId: {
          userId,
          resourceId
        }
      }
    });

    res.json({
      message: "Ресурс успішно видалено з обраного"
    });
  } catch (error) {
    next(error);
  }
}
