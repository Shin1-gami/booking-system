
import { z } from "zod";

export const createBookingSchema = z.object({
  resourceId: z.number().int().positive(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date()
}).refine(
  data => data.startTime < data.endTime,
  {
    message: "Дата завершення повинна бути пізніше дати початку",
    path: ["endTime"]
  }
);

export const updateBookingSchema = z.object({
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "CANCELLED",
    "COMPLETED"
  ]).optional()
}).refine(
  data => Object.keys(data).length > 0,
  {
    message: "Необхідно передати хоча б одне поле"
  }
);
