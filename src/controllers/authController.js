
import { createHash } from 'node:crypto';

import { prisma } from '../config/prisma.js';

import {
  hashPassword,
  comparePassword
} from '../utils/password.js';

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/jwt.js';

/**
 * Створення SHA-256 хешу refresh-токена.
 * У базі зберігається хеш, а не сам токен.
 */
function hashToken(token) {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

/**
 * Генерація та збереження пари токенів.
 */
async function issueTokens(user) {
  const accessToken = generateAccessToken(
    user.id,
    user.role.name
  );

  const refreshToken = generateRefreshToken(user.id);

  const decoded = verifyRefreshToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(decoded.exp * 1000)
    }
  });

  return {
    accessToken,
    refreshToken
  };
}

/**
 * Реєстрація нового користувача.
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Заповніть усі обов’язкові поля'
      });
    }

    if (typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string') {
      return res.status(400).json({
        error: 'Некоректний формат вхідних даних'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        error: 'Ім’я повинно містити щонайменше 2 символи'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        error: 'Некоректна адреса електронної пошти'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Пароль повинен містити щонайменше 8 символів'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Користувач із такою поштою вже існує'
      });
    }

    const role = await prisma.role.findUnique({
      where: {
        name: 'USER'
      }
    });

    if (!role) {
      return res.status(500).json({
        error: 'Роль USER відсутня в базі даних'
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        roleId: role.id
      },
      include: {
        role: true
      }
    });

    const tokens = await issueTokens(user);

    return res.status(201).json({
      message: 'Реєстрація успішна',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name
      },
      ...tokens
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Вхід користувача в систему.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password ||
        typeof email !== 'string' ||
        typeof password !== 'string') {
      return res.status(400).json({
        error: 'Вкажіть електронну пошту та пароль'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      },
      include: {
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Неправильна електронна пошта або пароль'
      });
    }

    const passwordIsValid = await comparePassword(
      password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        error: 'Неправильна електронна пошта або пароль'
      });
    }

    const tokens = await issueTokens(user);

    return res.status(200).json({
      message: 'Вхід успішний',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name
      },
      ...tokens
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Оновлення access та refresh токенів.
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken ||
        typeof refreshToken !== 'string') {
      return res.status(400).json({
        error: 'Refresh Token не передано'
      });
    }

    let decoded;

    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({
        error: 'Недійсний або прострочений Refresh Token'
      });
    }

    const tokenHash = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        tokenHash
      },
      include: {
        user: {
          include: {
            role: true
          }
        }
      }
    });

    if (!storedToken) {
      return res.status(401).json({
        error: 'Refresh Token не знайдено'
      });
    }

    if (storedToken.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: {
          userId: storedToken.userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });

      return res.status(401).json({
        error: 'Refresh Token уже використано'
      });
    }

    if (storedToken.expiresAt <= new Date()) {
      return res.status(401).json({
        error: 'Refresh Token прострочений'
      });
    }

    if (decoded.userId !== storedToken.userId) {
      return res.status(401).json({
        error: 'Некоректний Refresh Token'
      });
    }

    await prisma.refreshToken.update({
      where: {
        id: storedToken.id
      },
      data: {
        revokedAt: new Date()
      }
    });

    const tokens = await issueTokens(storedToken.user);

    return res.status(200).json({
      message: 'Токени успішно оновлено',
      ...tokens
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Вихід користувача із системи.
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken && typeof refreshToken === 'string') {
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash: hashToken(refreshToken),
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });
    }

    return res.status(204).send();

  } catch (error) {
    next(error);
  }
};
