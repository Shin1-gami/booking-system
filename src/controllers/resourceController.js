
import { prisma } from "../config/prisma.js";

// Отримати ресурси з пошуком, фільтрацією та пагінацією
export async function getResources(req, res, next) {
  try {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      location,
      sortBy = "createdAt",
      order = "desc",
      page = "1",
      limit = "10"
    } = req.query;

    // Перевірка параметрів пагінації
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      !Number.isInteger(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        error: "Некоректні параметри page або limit"
      });
    }

    // Перевірка категорії
    let parsedCategoryId;

    if (categoryId !== undefined) {
      parsedCategoryId = Number(categoryId);

      if (
        !Number.isInteger(parsedCategoryId) ||
        parsedCategoryId < 1
      ) {
        return res.status(400).json({
          error: "Некоректний categoryId"
        });
      }
    }

    // Перевірка цін
    let parsedMinPrice;
    let parsedMaxPrice;

    if (minPrice !== undefined) {
      parsedMinPrice = Number(minPrice);

      if (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0) {
        return res.status(400).json({
          error: "Некоректна мінімальна ціна"
        });
      }
    }

    if (maxPrice !== undefined) {
      parsedMaxPrice = Number(maxPrice);

      if (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < 0) {
        return res.status(400).json({
          error: "Некоректна максимальна ціна"
        });
      }
    }

    if (
      parsedMinPrice !== undefined &&
      parsedMaxPrice !== undefined &&
      parsedMinPrice > parsedMaxPrice
    ) {
      return res.status(400).json({
        error: "Мінімальна ціна не може бути більшою за максимальну"
      });
    }

    // Дозволені поля для сортування
    const allowedSortFields = [
      "name",
      "price",
      "createdAt"
    ];

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        error: "Недозволене поле для сортування"
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        error: "Порядок сортування повинен бути asc або desc"
      });
    }

    // Формування умов пошуку
    const where = {};

    if (search && search.trim()) {
      where.OR = [
        {
          name: {
            contains: search.trim(),
            mode: "insensitive"
          }
        },
        {
          description: {
            contains: search.trim(),
            mode: "insensitive"
          }
        },
        {
          location: {
            contains: search.trim(),
            mode: "insensitive"
          }
        }
      ];
    }

    // Фільтр за категорією
    if (parsedCategoryId !== undefined) {
      where.categoryId = parsedCategoryId;
    }

    // Фільтр за місцем розташування
    if (location && location.trim()) {
      where.location = {
        contains: location.trim(),
        mode: "insensitive"
      };
    }

    // Фільтр за ціною
    if (
      parsedMinPrice !== undefined ||
      parsedMaxPrice !== undefined
    ) {
      where.price = {};

      if (parsedMinPrice !== undefined) {
        where.price.gte = parsedMinPrice;
      }

      if (parsedMaxPrice !== undefined) {
        where.price.lte = parsedMaxPrice;
      }
    }

    // Кількість пропущених записів
    const skip = (pageNumber - 1) * limitNumber;

    // Отримання ресурсів і загальної кількості
    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        include: {
          category: true
        },
        orderBy: {
          [sortBy]: order
        },
        skip,
        take: limitNumber
      }),

      prisma.resource.count({
        where
      })
    ]);

    // Відповідь сервера
    res.json({
      data: resources,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });

  } catch (error) {
    next(error);
  }
}

// Отримати ресурс за ID
export async function getResourceById(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: "Некоректний ID ресурсу"
      });
    }

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        category: true
      }
    });

    if (!resource) {
      return res.status(404).json({
        message: "Ресурс не знайдено"
      });
    }

    res.json(resource);
  } catch (error) {
    next(error);
  }
}

// Створити ресурс
export async function createResource(req, res, next) {
  try {
    const resource = await prisma.resource.create({
      data: req.body,
      include: {
        category: true
      }
    });

    res.status(201).json(resource);
  } catch (error) {
    next(error);
  }
}

// Оновити ресурс
export async function updateResource(req, res, next) {
  try {
    const id = Number(req.params.id);

    const resource = await prisma.resource.update({
      where: { id },
      data: req.body,
      include: {
        category: true
      }
    });

    res.json(resource);
  } catch (error) {
    next(error);
  }
}

// Видалити ресурс
export async function deleteResource(req, res, next) {
  try {
    const id = Number(req.params.id);

    await prisma.resource.delete({
      where: { id }
    });

    res.json({
      message: "Ресурс успішно видалено"
    });
  } catch (error) {
    next(error);
  }
}
