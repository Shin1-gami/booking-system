import { Router } from "express";

import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
} from "../controllers/resourceController.js";

import { validate } from "../middleware/validate.js";

import {
  createResourceSchema,
  updateResourceSchema
} from "../schemas/resourceSchema.js";

const router = Router();

router.get("/", getResources);
router.get("/:id", getResourceById);
router.post("/", validate(createResourceSchema), createResource);
router.put("/:id", validate(updateResourceSchema), updateResource);
router.delete("/:id", deleteResource);

export default router;