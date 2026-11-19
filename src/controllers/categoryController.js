
import { prisma } from "../config/prisma.js";

import {
  getCache,
  setCache,
  getCacheVersion,
  invalidateCache
} from "../utils/cache.js";

// Перевірка коректності ID категорії
function validateCategoryId(id) {
  return Number.isInteger(id) && id > 0;
}

// Отримати всі категорії
export async function getCategories(req, res, next) {
  try {
    const cacheVersion = await getCacheVersion("categories");
    const cacheKey = `cache:categories:${cacheVersion}:all`;

    // Перевірка Redis-кешу
    const cachedCategories = await getCache(cacheKey);

    if (cachedCategories !== null) {
      return res.json(cachedCategories);
    }

    // Отримання категорій із бази даних
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            resources: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    // Збереження результату в Redis-кеші
    await setCache(cacheKey, categories, 60);

    res.json(categories);
  } catch (error) {
    next(error);
  }
}

// Отримати категорію за ID
export async function getCategoryById(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!validateCategoryId(id)) {
      return res.status(400).json({
        message: "Некоректний ID категорії"
      });
    }

    const cacheVersion = await getCacheVersion("categories");
const cacheKey = `cache:categories:${cacheVersion}:item:${id}`;

const cachedCategory = await getCache(cacheKey);

if (cachedCategory !== null) {
  return res.json(cachedCategory);
}

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        resources: true
      }
    });

    if (!category) {
      return res.status(404).json({
        message: "Категорію не знайдено"
      });
    }

    await setCache(cacheKey, category, 60);

    res.json(category);
  } catch (error) {
    next(error);
  }
}

// Створити категорію
export async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        ...(description !== undefined && { description })
      }
    });

    await invalidateCache("categories");

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

// Оновити категорію
export async function updateCategory(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!validateCategoryId(id)) {
      return res.status(400).json({
        message: "Некоректний ID категорії"
      });
    }

    const { name, description } = req.body;

    const data = {};

    if (name !== undefined) {
      data.name = name;
    }

    if (description !== undefined) {
      data.description = description;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "Немає даних для оновлення"
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data
    });

    await invalidateCache("categories");
await invalidateCache("resources");

    res.json(category);
  } catch (error) {
    next(error);
  }
}

// Видалити категорію
export async function deleteCategory(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!validateCategoryId(id)) {
      return res.status(400).json({
        message: "Некоректний ID категорії"
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    await invalidateCache("categories");
await invalidateCache("resources");

    res.json({
      message: "Категорію успішно видалено"
    });
  } catch (error) {
    next(error);
  }
}
