
import { Router } from "express";

import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
} from "../controllers/resourceController.js";

import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

import {
  createResourceSchema,
  updateResourceSchema
} from "../schemas/resourceSchema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Resources
 *   description: Управління ресурсами системи бронювання
 */

/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: Отримати список ресурсів
 *     tags: [Resources]
 *     description: Повертає список ресурсів із підтримкою пошуку, фільтрації, сортування та пагінації.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Пошук за назвою, описом або місцем розташування
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Фільтрація за категорією
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Мінімальна ціна
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Максимальна ціна
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Місце розташування
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt]
 *         description: Поле сортування
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Напрямок сортування
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер сторінки
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Кількість записів на сторінці
 *     responses:
 *       200:
 *         description: Список ресурсів успішно отримано
 *       400:
 *         description: Некоректні параметри запиту
 *       500:
 *         description: Внутрішня помилка сервера
 */
router.get("/", getResources);

/**
 * @swagger
 * /api/resources/{id}:
 *   get:
 *     summary: Отримати ресурс за ID
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ідентифікатор ресурсу
 *     responses:
 *       200:
 *         description: Ресурс успішно знайдено
 *       400:
 *         description: Некоректний ID
 *       404:
 *         description: Ресурс не знайдено
 *       500:
 *         description: Внутрішня помилка сервера
 */
router.get("/:id", getResourceById);

/**
 * @swagger
 * /api/resources:
 *   post:
 *     summary: Створити новий ресурс
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Дані нового ресурсу відповідно до схеми валідації
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Ресурс успішно створено
 *       400:
 *         description: Некоректні дані
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Доступ дозволено лише адміністраторам
 *       500:
 *         description: Внутрішня помилка сервера
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createResourceSchema),
  createResource
);

/**
 * @swagger
 * /api/resources/{id}:
 *   put:
 *     summary: Оновити ресурс
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ідентифікатор ресурсу
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Дані для оновлення ресурсу
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Ресурс успішно оновлено
 *       400:
 *         description: Некоректні дані
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Доступ дозволено лише адміністраторам
 *       404:
 *         description: Ресурс не знайдено
 *       500:
 *         description: Внутрішня помилка сервера
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateResourceSchema),
  updateResource
);

/**
 * @swagger
 * /api/resources/{id}:
 *   delete:
 *     summary: Видалити ресурс
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ідентифікатор ресурсу
 *     responses:
 *       200:
 *         description: Ресурс успішно видалено
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Доступ дозволено лише адміністраторам
 *       404:
 *         description: Ресурс не знайдено
 *       409:
 *         description: Неможливо видалити ресурс через пов'язані записи
 *       500:
 *         description: Внутрішня помилка сервера
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deleteResource
);

export default router;
