import { prisma } from "../config/prisma.js";

// Отримати всі бронювання
export async function getBookings(req, res, next) {
  try {
    const bookings = await prisma.booking.findMany({
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

// Отримати бронювання за ID
export async function getBookingById(req, res, next) {
  try {
    const id = Number(req.params.id);

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

    res.json(booking);
  } catch (error) {
    next(error);
  }
}

// Створити бронювання
export async function createBooking(req, res, next) {
  try {
    const { userId, resourceId, startTime, endTime } = req.body;

    // Перевірка наявності ресурсу
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource) {
      return res.status(404).json({
        message: "Ресурс не знайдено"
      });
    }

    // Перевірка користувача
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        message: "Користувача не знайдено"
      });
    }

    // Перевірка зайнятості ресурсу
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
        userId,
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

// Оновити бронювання
export async function updateBooking(req, res, next) {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.booking.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        message: "Бронювання не знайдено"
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
        status: { in: ["PENDING", "CONFIRMED"] },
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
      data: req.body
    });

    res.json(booking);
  } catch (error) {
    next(error);
  }
}

// Видалити бронювання
export async function deleteBooking(req, res, next) {
  try {
    const id = Number(req.params.id);

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