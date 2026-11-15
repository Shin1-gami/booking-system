
import multer from 'multer';

export function errorHandler(err, req, res, next) {
  console.error(err);

  // Помилки завантаження файлів
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Розмір файлу не повинен перевищувати 5 МБ'
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT' ||
        err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Дозволено завантажувати лише один файл'
      });
    }

    return res.status(400).json({
      error: 'Помилка завантаження файлу'
    });
  }

  // Помилка формату файлу
  if (err.status === 400) {
    return res.status(400).json({
      error: err.message
    });
  }

  // Помилки Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      message: 'Такий запис уже існує'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      message: 'Запис не знайдено'
    });
  }

  if (err.code === 'P2003') {
    return res.status(409).json({
      message: "Неможливо виконати операцію через пов'язані записи"
    });
  }

  res.status(err.status || 500).json({
    message: err.status
      ? err.message
      : 'Внутрішня помилка сервера'
  });
}
