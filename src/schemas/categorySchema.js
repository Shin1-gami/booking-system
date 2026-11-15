import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2, "Назва має містити мінімум 2 символи")
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).optional()
}).refine(data => Object.keys(data).length > 0);