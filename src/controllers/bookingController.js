import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as prismaModule from '../config/prisma.js';

const prisma = prismaModule.prisma || prismaModule.default;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadPublishUserEvent = async () => {
  const candidates = [
    '../utils/events.js',
    '../utils/userEvents.js',
    '../utils/eventPublisher.js',
    '../services/eventService.js',
    '../services/events.js',
    '../socket/events.js',
    '../socket/index.js',
  ];

  for (const relPath of candidates) {
    const fullPath = path.resolve(__dirname, relPath);
    if (fs.existsSync(fullPath)) {
      const mod = await import(pathToFileURL(fullPath).href);
      if (typeof mod.publishUserEvent === 'function') {
        return mod.publishUserEvent;
      }
    }
  }

  return async (userId, eventName, payload) => {
    if (prisma.userEvent?.create) {
      await prisma.userEvent.create({
        data: {
          userId,
          event: eventName,
          payload: JSON.parse(JSON.stringify(payload)),
        },
      });
    }
  };
};

const publishUserEvent = await loadPublishUserEvent();

const parseId = (rawId) => {
  const str = String(rawId).trim();
  if (!/^[1-9]\d*$/.test(str)) {
    const err = new Error('Некоректний ідентифікатор');
    err.statusCode = 400;
    throw err;
  }
  return Number(str);
};

const getAuthenticatedUserId = (req) => {
  const rawUserId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
  if (rawUserId === undefined || rawUserId === null) {
    const err = new Error('Не вдалося визначити ідентифікатор користувача з токена авторизації');
    err.statusCode = 401;
    throw err;
  }
  return parseId(rawUserId);
};

const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED'];

const validateTimeWindow = (startTime, endTime, { checkPast = true } = {}) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const err = new Error('Некоректний формат дати початку або завершення бронювання');
    err.statusCode = 400;
    throw err;
  }

  if (end <= start) {
    const err = new Error('Час завершення бронювання має бути пізнішим за час початку');
    err.statusCode = 400;
    throw err;
  }

  if (checkPast && start < new Date()) {
    const err = new Error('Неможливо створити бронювання на час у минулому');
    err.statusCode = 400;
    throw err;
  }

  return { start, end };
};

export const getBookings = async (req, res, next) => {
  try {
    const currentUserId = getAuthenticatedUserId(req);

    if (req.query.page !== undefined) {
      const parsedPage = Number(req.query.page);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        return res.status(400).json({
          error: 'Параметр page має бути цілим числом не менше 1',
          message: 'Параметр page має бути цілим числом не менше 1',
        });
      }
    }

    if (req.query.limit !== undefined) {
      const parsedLimit = Number(req.query.limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        return res.status(400).json({
          error: 'Параметр limit має бути цілим числом не менше 1',
          message: 'Параметр limit має бути цілим числом не менше 1',
        });
      }
    }

    const page = req.query.page !== undefined ? Number(req.query.page) : 1;
    const limit = req.query.limit !== undefined ? Math.min(100, Number(req.query.limit)) : 10;
    const skip = (page - 1) * limit;

    const where = req.user.role === 'ADMIN' ? {} : { userId: currentUserId };

    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.resourceId) {
      where.resourceId = parseId(req.query.resourceId);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          resource: {
            include: { category: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const currentUserId = getAuthenticatedUserId(req);
    const id = parseId(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        resource: { include: { category: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({
        error: 'Бронювання не знайдено',
        message: 'Бронювання не знайдено',
      });
    }

    if (req.user.role !== 'ADMIN' && booking.userId !== currentUserId) {
      return res.status(403).json({
        error: 'Доступ до цього бронювання заборонено',
        message: 'Доступ до цього бронювання заборонено',
      });
    }

    return res.status(200).json(booking);
  } catch (err) {
    return next(err);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const currentUserId = getAuthenticatedUserId(req);
    const resourceId = parseId(req.body.resourceId);
    const { start, end } = validateTimeWindow(req.body.startTime, req.body.endTime, {
      checkPast: true,
    });

    const booking = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking_resource_${resourceId}`}))`;

      const resource = await tx.resource.findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        const err = new Error('Ресурс для бронювання не знайдено');
        err.statusCode = 404;
        throw err;
      }

      const conflictingBooking = await tx.booking.findFirst({
        where: {
          resourceId,
          status: { in: ACTIVE_BOOKING_STATUSES },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });

      if (conflictingBooking) {
        const err = new Error('Обраний часовий слот уже зайнятий');
        err.statusCode = 409;
        throw err;
      }

      return tx.booking.create({
        data: {
          userId: currentUserId,
          resourceId,
          startTime: start,
          endTime: end,
          status: 'PENDING',
        },
        include: {
          resource: { include: { category: true } },
        },
      });
    });

    await publishUserEvent(currentUserId, 'booking:created', booking).catch(() => {});

    return res.status(201).json(booking);
  } catch (err) {
    return next(err);
  }
};

export const updateBooking = async (req, res, next) => {
  try {
    const currentUserId = getAuthenticatedUserId(req);
    const id = parseId(req.params.id);
    const { startTime, endTime, status } = req.body;

    if (status !== undefined && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Змінювати статус бронювання може лише адміністратор',
        message: 'Змінювати статус бронювання може лише адміністратор',
      });
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({ where: { id } });

      if (!existing) {
        const err = new Error('Бронювання не знайдено');
        err.statusCode = 404;
        throw err;
      }

      if (req.user.role !== 'ADMIN' && existing.userId !== currentUserId) {
        const err = new Error('Недостатньо прав для зміни цього бронювання');
        err.statusCode = 403;
        throw err;
      }

      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking_resource_${existing.resourceId}`}))`;

      const nextStatus = status ?? existing.status;
      const isTimeChanged = startTime !== undefined || endTime !== undefined;

      const { start, end } = validateTimeWindow(
        startTime ?? existing.startTime,
        endTime ?? existing.endTime,
        { checkPast: isTimeChanged }
      );

      if (ACTIVE_BOOKING_STATUSES.includes(nextStatus)) {
        const conflict = await tx.booking.findFirst({
          where: {
            id: { not: id },
            resourceId: existing.resourceId,
            status: { in: ACTIVE_BOOKING_STATUSES },
            startTime: { lt: end },
            endTime: { gt: start },
          },
        });

        if (conflict) {
          const err = new Error('Оновлений часовий інтервал перетинається з іншим бронюванням');
          err.statusCode = 409;
          throw err;
        }
      }

      return tx.booking.update({
        where: { id },
        data: {
          startTime: start,
          endTime: end,
          status: nextStatus,
        },
        include: {
          resource: { include: { category: true } },
        },
      });
    });

    await publishUserEvent(updatedBooking.userId, 'booking:updated', updatedBooking).catch(
      () => {}
    );

    return res.status(200).json(updatedBooking);
  } catch (err) {
    return next(err);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const currentUserId = getAuthenticatedUserId(req);
    const id = parseId(req.params.id);
    const existing = await prisma.booking.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        error: 'Бронювання не знайдено',
        message: 'Бронювання не знайдено',
      });
    }

    if (req.user.role !== 'ADMIN' && existing.userId !== currentUserId) {
      return res.status(403).json({
        error: 'Недостатньо прав для скасування цього бронювання',
        message: 'Недостатньо прав для скасування цього бронювання',
      });
    }

    const cancelled = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return res.status(200).json(cancelled);
  } catch (err) {
    return next(err);
  }
};

export const deleteBooking = cancelBooking;
export const getAllBookings = getBookings;
export const getMyBookings = getBookings;
export const updateBookingStatus = updateBooking;