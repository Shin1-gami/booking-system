import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email є обов’язковим')
    .email('Введіть коректну адресу електронної пошти'),
  password: z
    .string()
    .min(6, 'Пароль має містити щонайменше 6 символів')
    .max(100, 'Пароль занадто довгий'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Ім’я має містити щонайменше 2 символи')
      .max(80, 'Ім’я не може перевищувати 80 символів'),
    email: z
      .string()
      .trim()
      .min(1, 'Email є обов’язковим')
      .email('Введіть коректну адресу електронної пошти'),
    password: z
      .string()
      .min(8, 'Пароль має містити щонайменше 8 символів')
      .max(100, 'Пароль занадто довгий'),
    confirmPassword: z.string().min(1, 'Підтвердіть пароль'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Паролі не співпадають',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const resourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Назва ресурсу має містити щонайменше 2 символи')
    .max(120, 'Назва занадто довга'),
  description: z
    .string()
    .trim()
    .max(1000, 'Опис не може перевищувати 1000 символів')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .trim()
    .min(2, 'Локація має містити щонайменше 2 символи')
    .max(150, 'Локація не може перевищувати 150 символів'),
  price: z
    .number({ invalid_type_error: 'Вкажіть коректну числову ціну' })
    .min(0, 'Ціна не може бути від’ємною')
    .max(1_000_000, 'Перевищено максимальну ціну'),
  capacity: z
    .number({ invalid_type_error: 'Вкажіть ціле число' })
    .int('Місткість має бути цілим числом')
    .min(1, 'Мінімальна місткість — 1 особа')
    .max(10_000, 'Занадто велика місткість')
    .optional(),
  status: z.enum(['AVAILABLE', 'MAINTENANCE', 'UNAVAILABLE']),
  categoryId: z.string().min(1, 'Оберіть категорію ресурсу'),
});

export type ResourceFormValues = z.infer<typeof resourceSchema>;

export const bookingSchema = z
  .object({
    resourceId: z.string().min(1, 'Оберіть ресурс для бронювання'),
    startTime: z.string().min(1, 'Вкажіть дату та час початку'),
    endTime: z.string().min(1, 'Вкажіть дату та час завершення'),
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
    notes: z
      .string()
      .trim()
      .max(500, 'Примітка не може перевищувати 500 символів')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      return !Number.isNaN(start) && !Number.isNaN(end) && end > start;
    },
    {
      message: 'Час завершення має бути пізніше часу початку',
      path: ['endTime'],
    }
  );

export type BookingFormValues = z.infer<typeof bookingSchema>;

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Назва категорії має містити щонайменше 2 символи')
    .max(80, 'Назва занадто довга'),
  description: z
    .string()
    .trim()
    .max(500, 'Опис не може перевищувати 500 символів')
    .optional()
    .or(z.literal('')),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;