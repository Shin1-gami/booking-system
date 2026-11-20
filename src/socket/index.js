
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";

import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";

import {
  redisClient,
  redisPubClient,
  redisSubClient
} from "../config/redis.js";

// Redis-ключ зі списком ID онлайн-користувачів
const ONLINE_USERS_KEY = "presence:online-users";

// Реєстрація нового підключення користувача
async function registerOnlineUser(userId, socketId) {
  const script = `
    redis.call("SADD", KEYS[1], ARGV[1])
    local connections = redis.call("SCARD", KEYS[1])

    if connections == 1 then
      redis.call("SADD", KEYS[2], ARGV[2])
      return 1
    end

    return 0
  `;

  return Number(
    await redisClient.eval(script, {
      keys: [
        `presence:user:${userId}`,
        ONLINE_USERS_KEY
      ],
      arguments: [socketId, String(userId)]
    })
  );
}

// Видалення підключення користувача
async function unregisterOnlineUser(userId, socketId) {
  const script = `
    local removed = redis.call("SREM", KEYS[1], ARGV[1])
    local remaining = redis.call("SCARD", KEYS[1])

    if removed == 1 and remaining == 0 then
      redis.call("DEL", KEYS[1])
      redis.call("SREM", KEYS[2], ARGV[2])
      return 1
    end

    return 0
  `;

  return Number(
    await redisClient.eval(script, {
      keys: [
        `presence:user:${userId}`,
        ONLINE_USERS_KEY
      ],
      arguments: [socketId, String(userId)]
    })
  );
}

// Отримання списку онлайн-користувачів
async function getOnlineUsers() {
  const users = await redisClient.sMembers(ONLINE_USERS_KEY);

  return users.map(Number);
}

export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Адаптер для обміну подіями між екземплярами Socket.IO
  io.adapter(
    createAdapter(redisPubClient, redisSubClient)
  );

  // Перевірка JWT перед встановленням з'єднання
  io.use((socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token;
      const authorization = socket.handshake.headers?.authorization;

      const token = authToken ||
        (authorization?.startsWith("Bearer ")
          ? authorization.slice(7)
          : null);

      if (!token) {
        return next(new Error("Необхідно авторизуватися"));
      }

      const decoded = verifyAccessToken(token);

      if (!decoded.userId) {
        return next(new Error("Недійсний токен"));
      }

      socket.user = {
        userId: Number(decoded.userId),
        role: decoded.role
      };

      next();
    } catch {
      next(new Error("Недійсний або прострочений токен"));
    }
  });

  // Обробка нового підключення
  io.on("connection", async (socket) => {
    const { userId, role } = socket.user;

    let presenceRegistered = false;

    // Обробник відключення реєструємо до асинхронних операцій
    socket.on("disconnect", async (reason) => {
      if (presenceRegistered) {
        try {
          const isLastConnection = await unregisterOnlineUser(
            userId,
            socket.id
          );

          // Повідомляємо про вихід лише після останнього підключення
          if (isLastConnection) {
            io.emit("presence:offline", { userId });
          }
        } catch (error) {
          console.error(
            "Помилка оновлення присутності користувача:",
            error
          );
        }
      }

      console.log(
        `Користувач ${userId} відключився. Причина: ${reason}`
      );
    });

    try {
      // Реєструємо підключення в Redis
      const isFirstConnection = await registerOnlineUser(
        userId,
        socket.id
      );

      presenceRegistered = true;

      // Кожен користувач автоматично отримує власну кімнату
      await socket.join(`user:${userId}`);

      // Надсилаємо список користувачів, які зараз онлайн
      socket.emit("presence:list", {
        users: await getOnlineUsers()
      });

      // Повідомляємо інших про появу користувача
      if (isFirstConnection) {
        io.emit("presence:online", { userId });
      }

      console.log(
        `Користувач ${userId} підключився до Socket.IO`
      );
    } catch (error) {
      console.error(
        "Помилка реєстрації онлайн-користувача:",
        error
      );

      socket.disconnect(true);
      return;
    }

    // Приєднання до кімнати ресурсу або бронювання
    socket.on("room:join", async (payload, callback) => {
      const respond =
        typeof callback === "function" ? callback : () => {};

      try {
        const { type, id } = payload ?? {};
        const roomId = Number(id);

        if (!Number.isInteger(roomId) || roomId <= 0) {
          return respond({
            success: false,
            message: "Некоректний ідентифікатор кімнати"
          });
        }

        if (type === "resource") {
          const resource = await prisma.resource.findUnique({
            where: { id: roomId },
            select: { id: true }
          });

          if (!resource) {
            return respond({
              success: false,
              message: "Ресурс не знайдено"
            });
          }

          const room = `resource:${roomId}`;
          await socket.join(room);

          return respond({
            success: true,
            message: "Ви приєдналися до кімнати ресурсу",
            room
          });
        }

        if (type === "booking") {
          const booking = await prisma.booking.findUnique({
            where: { id: roomId },
            select: { id: true, userId: true }
          });

          if (!booking) {
            return respond({
              success: false,
              message: "Бронювання не знайдено"
            });
          }

          // До кімнати бронювання можуть приєднатися
          // лише його власник або адміністратор
          if (booking.userId !== userId && role !== "ADMIN") {
            return respond({
              success: false,
              message: "Недостатньо прав для доступу до бронювання"
            });
          }

          const room = `booking:${roomId}`;
          await socket.join(room);

          return respond({
            success: true,
            message: "Ви приєдналися до кімнати бронювання",
            room
          });
        }

        return respond({
          success: false,
          message: "Невідомий тип кімнати"
        });
      } catch (error) {
        console.error(
          "Помилка приєднання до кімнати:",
          error
        );

        return respond({
          success: false,
          message: "Не вдалося приєднатися до кімнати"
        });
      }
    });

    // Вихід із кімнати
    socket.on("room:leave", async (payload, callback) => {
      const respond =
        typeof callback === "function" ? callback : () => {};

      const { type, id } = payload ?? {};
      const roomId = Number(id);

      if (
        !["resource", "booking"].includes(type) ||
        !Number.isInteger(roomId) ||
        roomId <= 0
      ) {
        return respond({
          success: false,
          message: "Некоректні параметри кімнати"
        });
      }

      try {
        const room = `${type}:${roomId}`;
        await socket.leave(room);

        return respond({
          success: true,
          message: "Ви залишили кімнату",
          room
        });
      } catch (error) {
        console.error("Помилка виходу з кімнати:", error);

        return respond({
          success: false,
          message: "Не вдалося залишити кімнату"
        });
      }
    });

    // Отримання історії подій після підключення або відновлення з'єднання
    socket.on("event:history", async (payload, callback) => {
      const respond =
        typeof callback === "function" ? callback : () => {};

      try {
        const afterId = Number(payload?.afterId ?? 0);
        const requestedLimit = Number(payload?.limit ?? 20);

        if (
          !Number.isInteger(afterId) ||
          afterId < 0 ||
          !Number.isInteger(requestedLimit) ||
          requestedLimit < 1
        ) {
          return respond({
            success: false,
            message: "Некоректні параметри історії подій"
          });
        }

        // Обмежуємо кількість подій одним запитом
        const limit = Math.min(requestedLimit, 100);

        // Отримуємо лише події поточного авторизованого користувача
        const events = await prisma.userEvent.findMany({
          where: {
            userId: socket.user.userId,
            id: {
              gt: afterId
            }
          },
          orderBy: {
            id: "asc"
          },
          take: limit + 1
        });

        const hasMore = events.length > limit;
        const resultEvents = events.slice(0, limit);

        return respond({
          success: true,
          events: resultEvents,
          hasMore
        });
      } catch (error) {
        console.error(
          "Помилка отримання історії подій:",
          error
        );

        return respond({
          success: false,
          message: "Не вдалося отримати історію подій"
        });
      }
    });

    // Підтвердження отримання події користувачем
    socket.on("event:ack", async (payload, callback) => {
      const respond =
        typeof callback === "function" ? callback : () => {};

      try {
        const eventId = Number(payload?.eventId);

        if (!Number.isInteger(eventId) || eventId <= 0) {
          return respond({
            success: false,
            message: "Некоректний ID події"
          });
        }

        // Перевіряємо, що подія належить поточному користувачу
        const event = await prisma.userEvent.findFirst({
          where: {
            id: eventId,
            userId: socket.user.userId
          },
          select: {
            id: true,
            acknowledgedAt: true
          }
        });

        if (!event) {
          return respond({
            success: false,
            message: "Подію не знайдено"
          });
        }

        // Якщо подію вже підтверджено, повторно не змінюємо дату
        if (event.acknowledgedAt) {
          return respond({
            success: true,
            alreadyAcknowledged: true,
            message: "Подію вже було підтверджено"
          });
        }

        await prisma.userEvent.updateMany({
          where: {
            id: eventId,
            userId: socket.user.userId,
            acknowledgedAt: null
          },
          data: {
            acknowledgedAt: new Date()
          }
        });

        return respond({
          success: true,
          message: "Отримання події підтверджено"
        });
      } catch (error) {
        console.error(
          "Помилка підтвердження події:",
          error
        );

        return respond({
          success: false,
          message: "Не вдалося підтвердити отримання події"
        });
      }
    });
  });

  return io;
}
