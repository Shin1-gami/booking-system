
import { Router } from "express";

import {
  getFavorites,
  createFavorite,
  deleteFavorite
} from "../controllers/favoriteController.js";

import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

import {
  createFavoriteSchema
} from "../schemas/favoriteSchema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: Управління обраними ресурсами користувачів
 */

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Отримати список обраного
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список обраного успішно отримано
 *       401:
 *         description: Необхідна авторизація
 */
router.get("/", authenticate, getFavorites);

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: Додати ресурс до обраного
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resourceId
 *             properties:
 *               resourceId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Ресурс успішно додано
 *       401:
 *         description: Необхідна авторизація
 */
router.post(
  "/",
  authenticate,
  validate(createFavoriteSchema),
  createFavorite
);

/**
 * @swagger
 * /api/favorites/{resourceId}:
 *   delete:
 *     summary: Видалити ресурс з обраного
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ресурс успішно видалено
 *       401:
 *         description: Необхідна авторизація
 *       404:
 *         description: Ресурс не знайдено в обраному
 */
router.delete("/:resourceId", authenticate, deleteFavorite);

export default router;
