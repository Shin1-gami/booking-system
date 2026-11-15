import { z } from "zod";

export const createFavoriteSchema = z.object({
  userId: z.number().int().positive(),
  resourceId: z.number().int().positive()
});