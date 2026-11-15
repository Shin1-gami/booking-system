
import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Перевірка Access Token користувача.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  // Перевіряємо наявність Bearer Token.
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Токен аутентифікації відсутній'
    });
  }

  const token = authHeader.slice(7);

  try {
    // Перевіряємо токен і записуємо дані користувача.
    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Недійсний або прострочений токен'
    });
  }
}
