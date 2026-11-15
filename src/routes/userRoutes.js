
import { Router } from "express";

import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from "../controllers/userController.js";

import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";

import {
  createUserSchema,
  updateUserSchema
} from "../schemas/userSchema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Управління користувачами системи
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Отримати список користувачів (ADMIN)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список користувачів
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Недостатньо прав
 */
router.get("/", authenticate, authorize("ADMIN"), getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Отримати профіль користувача
 *     tags: [Users]
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
 *         description: Профіль користувача
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Доступ заборонено
 *       404:
 *         description: Користувача не знайдено
 */
router.get("/:id", authenticate, getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Створити користувача (ADMIN)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Користувача створено
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Недостатньо прав
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createUserSchema),
  createUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Оновити профіль користувача
 *     tags: [Users]
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
 *         description: Дані користувача оновлено
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Доступ заборонено
 *       404:
 *         description: Користувача не знайдено
 */
router.put(
  "/:id",
  authenticate,
  validate(updateUserSchema),
  updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Видалити користувача (ADMIN)
 *     tags: [Users]
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
 *         description: Користувача видалено
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Користувача не знайдено
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deleteUser
);

export default router;
