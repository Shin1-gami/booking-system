import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';

/**
 * Перевіряє наявність секретного ключа.
 */
function getSecret(name) {
  const secret = process.env[name];

  if (!secret) {
    throw new Error(`Не задано змінну середовища ${name}`);
  }

  return secret;
}

/**
 * Генерація Access Token.
 * Використовується для доступу до захищених маршрутів.
 */
export function generateAccessToken(userId, role) {
  return jwt.sign(
    { userId, role },
    getSecret('JWT_SECRET'),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    }
  );
}

/**
 * Генерація Refresh Token.
 * Використовується для отримання нової пари токенів.
 */
export function generateRefreshToken(userId) {
  return jwt.sign(
    {
      userId,
      jti: randomUUID()
    },
    getSecret('REFRESH_TOKEN_SECRET'),
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    }
  );
}

/**
 * Перевірка Access Token.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, getSecret('JWT_SECRET'));
}

/**
 * Перевірка Refresh Token.
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, getSecret('REFRESH_TOKEN_SECRET'));
}
