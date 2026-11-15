import { z } from "zod";

export const createResourceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  location: z.string().min(2),
  price: z.number().nonnegative(),
  categoryId: z.number().int().positive()
});

export const updateResourceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  location: z.string().min(2).optional(),
  price: z.number().nonnegative().optional(),
  categoryId: z.number().int().positive().optional()
}).refine(data => Object.keys(data).length > 0);