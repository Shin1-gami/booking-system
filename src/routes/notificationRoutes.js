import { Router } from "express";

import {
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification
} from "../controllers/notificationController.js";

import { validate } from "../middleware/validate.js";

import {
  createNotificationSchema,
  updateNotificationSchema
} from "../schemas/notificationSchema.js";

const router = Router();

router.get("/", getNotifications);
router.post("/", validate(createNotificationSchema), createNotification);
router.put("/:id", validate(updateNotificationSchema), updateNotification);
router.delete("/:id", deleteNotification);

export default router;