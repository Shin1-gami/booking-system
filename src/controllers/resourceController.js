import { prisma } from "../config/prisma.js";

// Отримати всі ресурси
export async function getResources(req, res, next) {
  try {
    const resources = await prisma.resource.findMany({
      include: {
        category: true
      }
    });

    res.json(resources);
  } catch (error) {
    next(error);
  }
}

// Отримати ресурс за ID
export async function getResourceById(req, res, next) {
  try {
    const id = Number(req.params.id);

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
      include: { category: true }
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
      include: { category: true }
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