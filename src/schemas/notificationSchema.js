import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.number().int().positive(),
  message: z.string().min(1)
});

export const updateNotificationSchema = z.object({
  message: z.string().min(1).optional(),
  isRead: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0);