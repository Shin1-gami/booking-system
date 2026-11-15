
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

test('Повний цикл реєстрації, входу, оновлення токенів та виходу', async () => {
  const email = `integration-${randomUUID()}@example.com`;
  const password = 'Password123';

  let userId;

  try {
    // 1. Реєстрація
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Integration Test',
        email,
        password
      });

    assert.equal(registerResponse.status, 201);
    assert.equal(registerResponse.body.user.email, email);
    assert.equal(registerResponse.body.user.role, 'USER');
    assert.ok(registerResponse.body.accessToken);
    assert.ok(registerResponse.body.refreshToken);

    userId = registerResponse.body.user.id;

    const registerRefreshToken = registerResponse.body.refreshToken;

    // 2. Перевірка збереження користувача в БД
    const savedUser = await prisma.user.findUnique({
      where: { email }
    });

    assert.ok(savedUser);
    assert.notEqual(savedUser.password, password);

    // 3. Вхід
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: email.toUpperCase(),
        password
      });

    assert.equal(loginResponse.status, 200);
    assert.ok(loginResponse.body.accessToken);
    assert.ok(loginResponse.body.refreshToken);

    const loginRefreshToken = loginResponse.body.refreshToken;

    // 4. Перевірка доступу за Access Token
    const protectedResponse = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

    assert.equal(protectedResponse.status, 200);

    // 5. Оновлення токенів
    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: loginRefreshToken
      });

    assert.equal(refreshResponse.status, 200);
    assert.ok(refreshResponse.body.accessToken);
    assert.ok(refreshResponse.body.refreshToken);

    // 6. Старий Refresh Token більше не повинен працювати
    const oldTokenResponse = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: loginRefreshToken
      });

    assert.equal(oldTokenResponse.status, 401);

    // 7. Новий вхід після відкликання попередніх токенів
    const newLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password
      });

    assert.equal(newLoginResponse.status, 200);

    const newRefreshToken = newLoginResponse.body.refreshToken;

    // 8. Вихід із системи
    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .send({
        refreshToken: newRefreshToken
      });

    assert.equal(logoutResponse.status, 204);

    // 9. Перевірка відкликання токена після виходу
    const afterLogoutResponse = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: newRefreshToken
      });

    assert.equal(afterLogoutResponse.status, 401);

  } finally {
    // 10. Очищення тестових даних
    if (userId) {
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });

      await prisma.user.delete({
        where: { id: userId }
      });
    }
  }
});
