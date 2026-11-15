
import { Router } from "express";

import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking
} from "../controllers/bookingController.js";

import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";

import {
  createBookingSchema,
  updateBookingSchema
} from "../schemas/bookingSchema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Управління бронюваннями ресурсів
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Отримати список власних бронювань
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список бронювань успішно отримано
 *       401:
 *         description: Необхідна авторизація
 */
router.get("/", authenticate, getBookings);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Отримати бронювання за ID
 *     tags: [Bookings]
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
 *         description: Бронювання успішно знайдено
 *       400:
 *         description: Некоректний ID
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Немає доступу до бронювання
 *       404:
 *         description: Бронювання не знайдено
 */
router.get("/:id", authenticate, getBookingById);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Створити бронювання
 *     tags: [Bookings]
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
 *               - startTime
 *               - endTime
 *             properties:
 *               resourceId:
 *                 type: integer
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Бронювання успішно створено
 *       400:
 *         description: Некоректні дані
 *       401:
 *         description: Необхідна авторизація
 *       404:
 *         description: Ресурс не знайдено
 *       409:
 *         description: Конфлікт часу
 */
router.post(
  "/",
  authenticate,
  validate(createBookingSchema),
  createBooking
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Оновити власне бронювання
 *     tags: [Bookings]
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
 *         description: Бронювання успішно оновлено
 *       400:
 *         description: Некоректні дані
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Немає прав
 *       404:
 *         description: Бронювання не знайдено
 *       409:
 *         description: Конфлікт бронювання
 */
router.put(
  "/:id",
  authenticate,
  validate(updateBookingSchema),
  updateBooking
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Видалити власне бронювання
 *     tags: [Bookings]
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
 *         description: Бронювання успішно видалено
 *       401:
 *         description: Необхідна авторизація
 *       403:
 *         description: Немає прав
 *       404:
 *         description: Бронювання не знайдено
 */
router.delete("/:id", authenticate, deleteBooking);

export default router;
