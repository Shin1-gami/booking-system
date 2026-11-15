
import { Router } from "express";

import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/categoryController.js";

import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";

import {
  createCategorySchema,
  updateCategorySchema
} from "../schemas/categorySchema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Управління категоріями ресурсів
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Отримати список категорій
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Список категорій успішно отримано
 */
router.get("/", getCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Отримати категорію за ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Категорію успішно знайдено
 *       400:
 *         description: Некоректний ID категорії
 *       404:
 *         description: Категорію не знайдено
 */
router.get("/:id", getCategoryById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Створити категорію
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Категорію успішно створено
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Недостатньо прав
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCategorySchema),
  createCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Оновити категорію
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Категорію успішно оновлено
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Недостатньо прав
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateCategorySchema),
  updateCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Видалити категорію
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Категорію успішно видалено
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Недостатньо прав
 *       409:
 *         description: Неможливо видалити категорію через пов'язані записи
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deleteCategory
);

export default router;
