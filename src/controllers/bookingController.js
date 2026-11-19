
import { prisma } from "../config/prisma.js";
import { publishUserEvent } from "../utils/eventLogger.js";

// Надсилання подій про зміни бронювання через Socket.IO
async function emitBookingEvent(req, booking, event, extra = {}) {
  const io = req.app.get("io");

  const payload = {
    ...booking,
    ...extra
  };

  await publishUserEvent(
    io,
    booking.userId,
    event,
    payload,
    [
      `resource:${booking.resourceId}`,
      `booking:${booking.id}`
    ]
  );
}

// Отримання бронювань із пагінацією
export async function getBookings(req, res, next) {
  try {
    // Отримуємо параметри пагінації
    const page = Number(req.query.page ?? 1);
    const requestedLimit = Number(req.query.limit ?? 10);

    if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(requestedLimit) ||
    requestedLimit < 1
    ) {
    return res.status(400).json({
    message: "Некоректні параметри пагінації"
      });
    }

    const limit = Math.min(requestedLimit, 100);

    const skip = (page - 1) * limit;

    // Адміністратор бачить усі бронювання,
    // звичайний користувач — лише власні
    const where = req.user.role === "ADMIN"
      ? {}
      : { userId: req.user.userId };

    // Отримуємо дані та загальну кількість записів
    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          userId: true,
          resourceId: true,
          startTime: true,
          endTime: true,
          status: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },

          resource: {
            select: {
              id: true,
              name: true,
              description: true,
              location: true,
              categoryId: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),

      prisma.booking.count({ where })
    ]);

    res.json({
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
}


// Отримання бронювання за ID
export async function getBookingById(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        message: "Некоректний ID бронювання"
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        resource: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        message: "Бронювання не знайдено"
      });
    }

    if (
      booking.userId !== req.user.userId &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message: "Немає доступу до цього бронювання"
      });
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
}

// Створення бронювання

export async function createBooking(req, res, next) {
  try {
    const { resourceId, startTime, endTime } = req.body;

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource) {
      return res.status(404).json({
        message: "Ресурс не знайдено"
      });
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        resourceId,
        status: {
          in: ["PENDING", "CONFIRMED"]
        },
        startTime: {
          lt: endTime
        },
        endTime: {
          gt: startTime
        }
      }
    });

    if (conflict) {
      return res.status(409).json({
        message: "Цей ресурс уже заброньований на вказаний час"
      });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.userId,
        resourceId,
        startTime,
        endTime
      }
    });

    // Повідомляємо всіх зацікавлених у ресурсі користувачів
    await emitBookingEvent(req, booking, "booking:created");

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
}


// Оновлення бронювання
export async function updateBooking(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        message: "Некоректний ID бронювання"
      });
    }

    const existing = await prisma.booking.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        message: "Бронювання не знайдено"
      });
    }

    const isAdmin = req.user.role === "ADMIN";

    if (existing.userId !== req.user.userId && !isAdmin) {
      return res.status(403).json({
        message: "Немає прав для зміни цього бронювання"
      });
    }

    if (req.body.status && !isAdmin) {
      return res.status(403).json({
        message: "Змінювати статус бронювання може лише адміністратор"
      });
    }

    const startTime = req.body.startTime ?? existing.startTime;
    const endTime = req.body.endTime ?? existing.endTime;

    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        message: "Дата завершення повинна бути пізніше дати початку"
      });
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        id: { not: id },
        resourceId: existing.resourceId,
        status: {
          in: ["PENDING", "CONFIRMED"]
        },
        startTime: { lt: endTime },
        endTime: { gt: startTime }
      }
    });

    if (conflict) {
      return res.status(409).json({
        message: "На цей час ресурс уже заброньований"
      });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(req.body.startTime && { startTime }),
        ...(req.body.endTime && { endTime }),
        ...(isAdmin && req.body.status && { status: req.body.status })
      }
    });

    // Якщо адміністратор скасував бронювання
    if (booking.status === "CANCELLED" &&
        existing.status !== "CANCELLED") {
      await emitBookingEvent(req, booking, "booking:cancelled");
    } else {
      await emitBookingEvent(req, booking, "booking:updated");
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
}

// Видалення бронювання

export async function deleteBooking(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        message: "Некоректний ID бронювання"
      });
    }

    const existing = await prisma.booking.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        message: "Бронювання не знайдено"
      });
    }

    if (
      existing.userId !== req.user.userId &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message: "Немає прав для видалення цього бронювання"
      });
    }

    await prisma.booking.delete({
      where: { id }
    });

    // Повідомляємо клієнтів після успішного видалення
    await emitBookingEvent(req, existing, "booking:cancelled", {
      deleted: true
    });

    res.json({
      message: "Бронювання успішно видалено"
    });
  } catch (error) {
    next(error);
  }
}

