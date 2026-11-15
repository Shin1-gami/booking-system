export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({
      message: "Такий запис уже існує"
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      message: "Запис не знайдено"
    });
  }

  if (err.code === "P2003") {
    return res.status(409).json({
      message: "Неможливо виконати операцію через пов'язані записи"
    });
  }

  res.status(err.status || 500).json({
    message: err.status
      ? err.message
      : "Внутрішня помилка сервера"
  });
}