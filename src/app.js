import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { register, collectDefaultMetrics } from 'prom-client';

import * as loggerModule from './utils/logger.js';
import * as redisModule from './config/redis.js';
import * as swaggerModule from './config/swagger.js';
import routes from './routes/index.js';
import * as authMiddleware from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const logger = loggerModule.default || loggerModule.logger;
const redisClient = redisModule.redisClient || redisModule.default;
const swaggerSpec = swaggerModule.default || swaggerModule.swaggerSpec;
const authenticate = authMiddleware.authenticate || authMiddleware.protect;
const authorize = authMiddleware.authorize || authMiddleware.requireRole;

const app = express();



// 1. Базові заголовки безпеки та обмеження CORS
const rawOrigins = [process.env.CLIENT_URL, process.env.FRONTEND_URL]
  .filter(Boolean)
  .join(',');
const allowedOrigins = (rawOrigins || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Доступ заборонено політикою CORS'));
    },
    credentials: true,
  })
);

// 2. Структуроване логування запитів
app.use(
  pinoHttp({
    ...(logger && { logger }),
    autoLogging: process.env.NODE_ENV !== 'test',
  })
);

// 3. Розподілений Rate Limiter на базі Redis
const createRateLimiter = () => {
  const isRedisReady =
    process.env.NODE_ENV !== 'test' &&
    redisClient &&
    (redisClient.isOpen || redisClient.status === 'ready');

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 200),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Забагато запитів з цієї IP-адреси, спробуйте пізніше',
      message: 'Забагато запитів з цієї IP-адреси, спробуйте пізніше',
    },
    ...(isRedisReady && {
      store: new RedisStore({
        sendCommand: (...args) =>
          typeof redisClient.sendCommand === 'function'
            ? redisClient.sendCommand(args)
            : redisClient.call(...args),
      }),
    }),
  });
};

app.use('/api', createRateLimiter());

// 4. Парсери тіла запиту та статика
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// 5. Prometheus метрики (захищено токеном або роллю ADMIN)
if (register.getMetricsAsArray().length === 0) {
  collectDefaultMetrics();
}

const protectMetrics = (req, res, next) => {
  const metricsToken = process.env.METRICS_TOKEN;
  if (metricsToken && req.headers.authorization === `Bearer ${metricsToken}`) {
    return next();
  }
  if (typeof authenticate === 'function' && typeof authorize === 'function') {
    return authenticate(req, res, () => authorize('ADMIN')(req, res, next));
  }
  return next();
};

app.get('/metrics', protectMetrics, async (_req, res, next) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    next(err);
  }
});

// 6. Кореневий маршрут, Swagger документація та основні API-маршрути
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Booking System API працює',
    docs: '/api-docs',
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', routes);

// 7. Обробка 404 та єдиний глобальний обробник помилок
app.use(notFound);
app.use(errorHandler);

export default app;