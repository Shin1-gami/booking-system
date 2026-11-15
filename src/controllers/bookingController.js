
import { prisma } from "../config/prisma.js";

// Отримання бронювань
export async function getBookings(req, res, next) {
  try {
    const where = req.user.role === "ADMIN"
      ? {}
      : { userId: req.user.userId };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        resource: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(bookings);
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

    if (startTime >= endTime) {
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

    res.json({
      message: "Бронювання успішно видалено"
    });
  } catch (error) {
    next(error);
  }
}
