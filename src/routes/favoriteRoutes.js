import { Router } from "express";

import {
  getFavorites,
  createFavorite,
  deleteFavorite
} from "../controllers/favoriteController.js";

import { validate } from "../middleware/validate.js";

import {
  createFavoriteSchema
} from "../schemas/favoriteSchema.js";

const router = Router();

router.get("/", getFavorites);
router.post("/", validate(createFavoriteSchema), createFavorite);
router.delete("/:resourceId", deleteFavorite);

export default router;