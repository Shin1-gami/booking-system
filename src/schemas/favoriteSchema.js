
import { z } from "zod";

export const createFavoriteSchema = z.object({
  resourceId: z.number().int().positive()
});
