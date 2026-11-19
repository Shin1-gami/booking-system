
import { Router } from "express";

import {
  getNotifications,
  createNotification,
  createNotificationsBatchController,
  updateNotification,
  deleteNotification
} from "../controllers/notificationController.js";

import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";

import {
  createNotificationSchema,
  updateNotificationSchema
} from "../schemas/notificationSchema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Управління сповіщеннями системи
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Отримати список сповіщень
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: ID користувача (лише для адміністратора)true
 *     responses:
 *       200:
 *         description: Список сповіщень успішно отримано
 *       401:
 *         description: Необхідна авторизація
 */
router.get("/", authenticate, getNotifications);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Створити сповіщення
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - message
 *             properties:
 *               userId:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Сповіщення успішно створено
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Недостатньо прав
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createNotificationSchema),
  createNotification
);

/**
 * @swagger
 * /api/notifications/batch:
 *   post:
 *     summary: Пакетне створення сповіщень
 *     description: Створює до 100 сповіщень за один запит та додає їх до черги BullMQ.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notifications
 *             properties:
 *               notifications:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - userId
 *                     - message
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     message:
 *                       type: string
 *                     priority:
 *                       type: string
 *                       enum: [LOW, NORMAL, HIGH, URGENT]
 *     responses:
 *       201:
 *         description: Пакет сповіщень успішно створено
 *       400:
 *         description: Некоректні дані
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Недостатньо прав
 */
router.post(
  "/batch",
  authenticate,
  authorize("ADMIN"),
  createNotificationsBatchController
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   put:
 *     summary: Оновити сповіщення
 *     tags: [Notifications]
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
 *             properties:
 *               message:
 *                 type: string
 *               isRead:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Сповіщення успішно оновлено
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Сповіщення не знайдено
 */
router.put(
  "/:id",
  authenticate,
  validate(updateNotificationSchema),
  updateNotification
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Видалити сповіщення
 *     tags: [Notifications]
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
 *         description: Сповіщення успішно видалено
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Сповіщення не знайдено
 */
router.delete("/:id", authenticate, deleteNotification);

export default router;
