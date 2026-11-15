
import fs from 'node:fs/promises';
import path from 'node:path';

import { prisma } from '../config/prisma.js';

// Завантаження файлу
export async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Файл не було передано'
      });
    }

    const file = await prisma.file.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedBy: req.user.userId
      }
    });

    res.status(201).json({
      message: 'Файл успішно завантажено',
      file
    });
  } catch (error) {
    // Якщо запис у БД не створився, видаляємо завантажений файл
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    next(error);
  }
}

// Отримання списку файлів користувача
export async function getFiles(req, res, next) {
  try {
    const files = await prisma.file.findMany({
      where: {
        uploadedBy: req.user.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      total: files.length,
      files
    });
  } catch (error) {
    next(error);
  }
}

// Отримання файлу за ID
export async function getFileById(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: 'Некоректний ID файлу'
      });
    }

    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      return res.status(404).json({
        error: 'Файл не знайдено'
      });
    }

    if (
      file.uploadedBy !== req.user.userId &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        error: 'Недостатньо прав для перегляду цього файлу'
      });
    }

    res.json(file);
  } catch (error) {
    next(error);
  }
}

// Видалення файлу
export async function deleteFile(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: 'Некоректний ID файлу'
      });
    }

    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      return res.status(404).json({
        error: 'Файл не знайдено'
      });
    }

    if (
      file.uploadedBy !== req.user.userId &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        error: 'Ви можете видаляти лише власні файли'
      });
    }

    // Видалення запису з бази даних
    await prisma.file.delete({
      where: { id }
    });

    // Видалення фізичного файлу з диска
    const uploadDirectory = path.resolve(process.cwd(), 'uploads');

    const filePath = path.resolve(uploadDirectory, file.filename);

    if (path.dirname(filePath) !== uploadDirectory) {
      return res.status(400).json({
        error: 'Некоректний шлях до файлу'
      });
    }

    await fs.unlink(filePath).catch((error) => {
      if (error.code !== 'ENOENT') {
        console.error('Помилка видалення фізичного файлу:', error);
      }
    });

    res.json({
      message: 'Файл успішно видалено'
    });
  } catch (error) {
    next(error);
  }
}
