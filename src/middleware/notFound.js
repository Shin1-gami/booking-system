export function notFound(req, res, next) {
  const error = new Error(
    `Маршрут ${req.method} ${req.originalUrl} не знайдено`
  );

  error.statusCode = 404;

  next(error);
}