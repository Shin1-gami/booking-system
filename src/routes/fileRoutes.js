
import { Router } from 'express';

import {
  uploadFile,
  getFiles,
  getFileById,
  deleteFile
} from '../controllers/fileController.js';

import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: Завантаження та управління файлами користувачів
 */

// Усі файлові маршрути потребують авторизації
router.use(authenticate);

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Завантажити файл
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Файл для завантаження (JPG, JPEG, PNG, GIF або PDF)
 *     responses:
 *       201:
 *         description: Файл успішно завантажено
 *       400:
 *         description: Некоректний формат файлу або файл не передано
 *       401:
 *         description: Необхідна авторизація
 *       413:
 *         description: Розмір файлу перевищує 5 МБ
 *       500:
 *         description: Внутрішня помилка сервера
 */
router.post('/upload', upload.single('file'), uploadFile);

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Отримати список власних файлів
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список файлів успішно отримано
 *       401:
 *         description: Необхідна авторизація
 *       500:
 *         description: Внутрішня помилка сервера
 */
router.get('/', getFiles);

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Отримати файл за ID
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ідентифікатор файлу
 *     responses:
 *       200:
 *         description: Інформацію про файл успішно отримано
 *       400:
 *         description: Некоректний ID файлу
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Немає прав для перегляду файлу
 *       404:
 *         description: Файл не знайдено
 *       500:
 *         description: Внутрішня помилка сервера
 */
router.get('/:id', getFileById);

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Видалити файл
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ідентифікатор файлу
 *     responses:
 *       200:
 *         description: Файл успішно видалено
 *       400:
 *         description: Некоректний ID файлу
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Немає прав для видалення файлу
 *       404:
 *         description: Файл не знайдено
 *       500:
 *         description: Внутрішня помилка сервера
 */
router.delete('/:id', deleteFile);

export default router;
