import { Router } from "express";

import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking
} from "../controllers/bookingController.js";

import { validate } from "../middleware/validate.js";

import {
  createBookingSchema,
  updateBookingSchema
} from "../schemas/bookingSchema.js";

const router = Router();

router.get("/", getBookings);
router.get("/:id", getBookingById);
router.post("/", validate(createBookingSchema), createBooking);
router.put("/:id", validate(updateBookingSchema), updateBooking);
router.delete("/:id", deleteBooking);

export default router;