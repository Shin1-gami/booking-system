
import argon2 from 'argon2';

/**
 * Хешування пароля за допомогою Argon2id.
 */
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Пароль повинен містити щонайменше 8 символів');
  }

  return argon2.hash(password, {
    type: argon2.argon2id
  });
}

/**
 * Перевірка пароля за збереженим хешем.
 */
export async function comparePassword(password, hash) {
  if (typeof password !== 'string' || typeof hash !== 'string') {
    return false;
  }

  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
