
/**
 * Перевірка прав доступу користувача за роллю.
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    // Перевіряємо, чи пройшов користувач аутентифікацію.
    if (!req.user) {
      return res.status(401).json({
        error: 'Необхідна аутентифікація'
      });
    }

    // Перевіряємо роль користувача.
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Недостатньо прав для виконання цієї операції'
      });
    }

    next();
  };
}
