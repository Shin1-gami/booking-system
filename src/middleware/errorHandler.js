export const notFound = (req, res, next) => {
  const error = new Error(`Маршрут не знайдено: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (err, req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Внутрішня помилка сервера';
  let details;

  // Обробка помилок валідації Zod
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Помилка валідації вхідних даних';
    details = (err.issues || err.errors || []).map((issue) => ({
      field: Array.isArray(issue.path) ? issue.path.join('.') : '',
      message: issue.message,
    }));
  }

  // Обробка відомих кодів помилок Prisma
  if (typeof err.code === 'string' && err.code.startsWith('P')) {
    switch (err.code) {
      case 'P2002': {
        statusCode = 409;
        const target = Array.isArray(err.meta?.target)
          ? err.meta.target.join(', ')
          : err.meta?.target;
        message = target
          ? `Запис із таким значенням унікального поля (${target}) вже існує`
          : 'Конфлікт унікальності даних: запис уже існує';
        break;
      }
      case 'P2003': {
        statusCode = 409;
        message =
          'Конфлікт цілісності посилань: повʼязаний запис не існує або обʼєкт використовується іншими записами';
        break;
      }
      case 'P2014': {
        statusCode = 409;
        message = 'Зміна порушує обовʼязковий звʼязок між записами';
        break;
      }
      case 'P2025': {
        statusCode = 404;
        message = 'Запитуваний запис не знайдено';
        break;
      }
      case 'P2034': {
        statusCode = 409;
        message = 'Конфлікт паралельної транзакції. Будь ласка, повторіть запит';
        break;
      }
      default: {
        statusCode = 400;
        message = `Помилка бази даних (${err.code})`;
      }
    }
  }

  // Обробка помилок завантаження файлів Multer
 if (err.name === 'MulterError') {
    statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = `Помилка завантаження файлу: ${err.message}`;
  }

  // Обробка помилок JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Недійсний або прострочений токен авторизації';
  }

  if (req.log) {
    if (statusCode >= 500) {
      req.log.error({ err, statusCode }, message);
    } else {
      req.log.warn({ statusCode, code: err.code }, message);
    }
  }

  const responsePayload = {
    error: message,
    message,
    ...(err.code && { code: err.code }),
    ...(details && { details }),
  };

  if (process.env.NODE_ENV === 'development' && statusCode >= 500 && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);

  if (err.code === 'LIMIT_FILE_SIZE') {
  return res.status(413).json({
    error: 'Розмір файлу перевищує максимально допустимий ліміт',
    message: 'Розмір файлу перевищує максимально допустимий ліміт',
  });
}


};