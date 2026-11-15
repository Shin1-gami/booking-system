import { prisma } from "../config/prisma.js";

// Отримати обрані ресурси користувача
export async function getFavorites(req, res, next) {
  try {
    const userId = Number(req.query.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: "Необхідно вказати коректний userId"
      });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        resource: {
          include: {
            category: true
          }
        }
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
    const { userId, resourceId } = req.body;

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
      message: "Ресурс додано до обраного",
      favorite
    });
  } catch (error) {
    next(error);
  }
}

// Видалити ресурс з обраного
export async function deleteFavorite(req, res, next) {
  try {
    const userId = Number(req.query.userId);
    const resourceId = Number(req.params.resourceId);

    if (
      !Number.isInteger(userId) || userId <= 0 ||
      !Number.isInteger(resourceId) || resourceId <= 0
    ) {
      return res.status(400).json({
        message: "Необхідно вказати коректні ID користувача та ресурсу"
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
      message: "Ресурс видалено з обраного"
    });
  } catch (error) {
    next(error);
  }
}