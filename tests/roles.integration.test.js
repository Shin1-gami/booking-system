
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';

test('Перевірка прав доступу USER та ADMIN для категорій', async () => {
  const suffix = randomUUID();

  const userEmail = `user-${suffix}@example.com`;
  const adminEmail = `admin-${suffix}@example.com`;

  let userId;
  let adminId;
  let categoryId;

  try {
    // 1. Отримання ролей
    const userRole = await prisma.role.findUnique({
      where: { name: 'USER' }
    });

    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' }
    });

    assert.ok(userRole, 'Роль USER повинна існувати');
    assert.ok(adminRole, 'Роль ADMIN повинна існувати');

    // 2. Створення тестового USER
    const user = await prisma.user.create({
      data: {
        name: 'Integration User',
        email: userEmail,
        password: 'test-password-not-used',
        roleId: userRole.id
      }
    });

    userId = user.id;

    // 3. Створення тестового ADMIN
    const admin = await prisma.user.create({
      data: {
        name: 'Integration Admin',
        email: adminEmail,
        password: 'test-password-not-used',
        roleId: adminRole.id
      }
    });

    adminId = admin.id;

    // 4. Генерація токенів
    const userToken = generateAccessToken(user.id, 'USER');
    const adminToken = generateAccessToken(admin.id, 'ADMIN');

    // 5. USER не може створити категорію
    const userCreateResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: `User Category ${suffix}` });

    assert.equal(userCreateResponse.status, 403);

    // 6. ADMIN створює категорію
    const adminCreateResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Admin Category ${suffix}` });

    assert.equal(adminCreateResponse.status, 201);
    assert.equal(adminCreateResponse.body.name, `Admin Category ${suffix}`);

    categoryId = adminCreateResponse.body.id;

    // 7. USER не може змінити категорію
    const userUpdateResponse = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: `Changed Category ${suffix}` });

    assert.equal(userUpdateResponse.status, 403);

    // 8. ADMIN змінює категорію
    const adminUpdateResponse = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Updated Category ${suffix}` });

    assert.equal(adminUpdateResponse.status, 200);
    assert.equal(adminUpdateResponse.body.name, `Updated Category ${suffix}`);

    // 9. USER не може видалити категорію
    const userDeleteResponse = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(userDeleteResponse.status, 403);

    // 10. ADMIN видаляє категорію
    const adminDeleteResponse = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminDeleteResponse.status, 200);

    categoryId = undefined;

  } finally {
    // 11. Очищення тестових даних
    if (categoryId) {
      await prisma.category.deleteMany({
        where: { id: categoryId }
      });
    }

    if (userId || adminId) {
      await prisma.user.deleteMany({
        where: {
          id: { in: [userId, adminId].filter(Boolean) }
        }
      });
    }
  }
});
