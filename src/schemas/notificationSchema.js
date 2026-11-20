import { z } from 'zod';

const idSchema = z.union([
  z.number().int().positive('ID має бути додатним цілим числом'),
  z.string().min(1, 'ID не може бути порожнім'),
]);

export const notificationPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

export const createNotificationSchema = z.object({
  userId: idSchema,
  message: z
    .string({ required_error: 'Повідомлення є обовʼязковим' })
    .trim()
    .min(1, 'Повідомлення не може бути порожнім')
    .max(1000, 'Повідомлення не може перевищувати 1000 символів'),
  priority: notificationPriorityEnum.optional().default('NORMAL'),
});

export const bulkNotificationSchema = z.object({
  userIds: z
    .array(idSchema)
    .min(1, 'Необхідно вказати хоча б одного користувача')
    .max(500, 'Максимум 500 отримувачів за один запит'),
  message: z
    .string({ required_error: 'Повідомлення є обовʼязковим' })
    .trim()
    .min(1, 'Повідомлення не може бути порожнім')
    .max(1000, 'Повідомлення не може перевищувати 1000 символів'),
  priority: notificationPriorityEnum.optional().default('NORMAL'),
});

export const createBulkNotificationSchema = bulkNotificationSchema;

export const updateNotificationSchema = z
  .object({
    isRead: z.boolean().optional(),
    read: z.boolean().optional(),
    message: z
      .string()
      .trim()
      .min(1, 'Повідомлення не може бути порожнім')
      .max(1000, 'Повідомлення не може перевищувати 1000 символів')
      .optional(),
    priority: notificationPriorityEnum.optional(),
  })
  .passthrough()
  .optional()
  .default({});