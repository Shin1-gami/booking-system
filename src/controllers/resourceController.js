
import { prisma } from "../config/prisma.js";

import {
  getCache,
  setCache,
  getCacheVersion,
  invalidateCache
} from "../utils/cache.js";

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

// Формування ключа кешу з урахуванням версії та параметрів запиту
const cacheVersion = await getCacheVersion("resources");

const cacheKey =
  `cache:resources:${cacheVersion}:${req.originalUrl}`;

// Перевірка наявності даних у Redis
const cachedData = await getCache(cacheKey);

if (cachedData !== null) {
  return res.json(cachedData);
}

    // Кількість пропущених записів
    const skip = (pageNumber - 1) * limitNumber;

    // Отримання ресурсів і загальної кількості
    const [resources, total] = await Promise.all([
  prisma.resource.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      location: true,
      price: true,
      categoryId: true,
      createdAt: true,
      category: {
        select: {
          id: true,
          name: true
        }
      }
    },
    skip,
    take: limitNumber,
    orderBy: {
      [sortBy]: order
    }
  }),

  prisma.resource.count({
    where
  })
]);

    // Формування відповіді
const responseData = {
  data: resources,
  pagination: {
    total,
    page: pageNumber,
    limit: limitNumber,
    totalPages: Math.ceil(total / limitNumber)
  }
};

// Збереження результату в Redis на 60 секунд
await setCache(cacheKey, responseData, 60);

// Відправлення відповіді
res.json(responseData);

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

    // Отримання версії кешу
const cacheVersion = await getCacheVersion("resources");

const cacheKey =
  `cache:resources:${cacheVersion}:item:${id}`;

// Перевірка кешу
const cachedResource = await getCache(cacheKey);

if (cachedResource !== null) {
  return res.json(cachedResource);
}

    const resource = await prisma.resource.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    description: true,
    location: true,
    price: true,
    categoryId: true,
    createdAt: true,
    category: {
      select: {
        id: true,
        name: true
      }
    }
  }
});

    if (!resource) {
      return res.status(404).json({
        message: "Ресурс не знайдено"
      });
    }

    await setCache(cacheKey, resource, 60);

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

    await invalidateCache("resources");
    await invalidateCache("categories");
    

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

    await invalidateCache("resources");
    await invalidateCache("categories");

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

    await invalidateCache("resources");
    await invalidateCache("categories");

    res.json({
      message: "Ресурс успішно видалено"
    });
  } catch (error) {
    next(error);
  }
}
