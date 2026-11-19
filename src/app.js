
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { httpLogger } from "./middleware/httpLogger.js";
import { metricsMiddleware } from "./middleware/metricsMiddleware.js";
import { notFound } from "./middleware/notFound.js";

const app = express();
app.use(httpLogger);
app.use(metricsMiddleware);

// Обмеження кількості запитів
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Забагато запитів. Спробуйте пізніше."
  }
});

// Middleware безпеки
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);

// Обмеження запитів для API
app.use("/api", apiLimiter);

// Головна сторінка API
app.get("/", (req, res) => {
  res.json({
    message: "Booking System API працює"
  });
});

// Swagger документація
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Маршрути
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/metrics", metricsRoutes);

// Обробка помилок
app.use(errorHandler);

// Обробка неіснуючих маршрутів
app.use(notFound);

// Централізована обробка помилок
app.use(errorHandler);

export default app;
