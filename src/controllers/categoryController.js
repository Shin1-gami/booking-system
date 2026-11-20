import * as prismaModule from '../config/prisma.js';
import * as redisModule from '../config/redis.js';

const prisma = prismaModule.prisma || prismaModule.default;
const redisClient = redisModule.redisClient || redisModule.default;

const CACHE_VERSION_KEY = 'cache:categories:version';
const CACHE_TTL_SECONDS = 300;

const parseId = (rawId) => (/^\d+$/.test(String(rawId)) ? Number(rawId) : String(rawId));

const bumpCategoriesCacheVersion = async () => {
  try {
    if (redisClient?.isOpen) {
      await redisClient.incr(CACHE_VERSION_KEY);
    }
  } catch {
    // Ігноруємо збій кешу, щоб не блокувати основну операцію БД
  }
};

export const getAllCategories = async (req, res, next) => {
  try {
    let version = '1';
    if (redisClient?.isOpen) {
      version = (await redisClient.get(CACHE_VERSION_KEY)) || '1';
      const cached = await redisClient.get(`cache:categories:v${version}:all`);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { resources: true },
        },
      },
    });

    if (redisClient?.isOpen) {
      await redisClient.setEx(
        `cache:categories:v${version}:all`,
        CACHE_TTL_SECONDS,
        JSON.stringify(categories)
      );
    }

    return res.status(200).json(categories);
  } catch (err) {
    return next(err);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { resources: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        error: 'Категорію не знайдено',
        message: 'Категорію не знайдено',
      });
    }

    return res.status(200).json(category);
  } catch (err) {
    return next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    const category = await prisma.category.create({
      data: { name },
    });

    await bumpCategoriesCacheVersion();

    return res.status(201).json(category);
  } catch (err) {
    return next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const { name } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: { name },
    });

    await bumpCategoriesCacheVersion();

    return res.status(200).json(category);
  } catch (err) {
    return next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);

    await prisma.category.delete({
      where: { id },
    });

    await bumpCategoriesCacheVersion();

    return res.status(200).json({
      message: 'Категорію успішно видалено',
    });
  } catch (err) {
    return next(err);
  }
};

export const getCategories = getAllCategories;