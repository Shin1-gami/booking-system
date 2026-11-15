
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';

test('Перевірка прав доступу USER та ADMIN для користувачів', async () => {
  const suffix = randomUUID();

  const userEmail = `user-${suffix}@example.com`;
  const anotherEmail = `another-${suffix}@example.com`;
  const adminEmail = `admin-${suffix}@example.com`;

  const createdIds = [];

  try {
    // 1. Отримання ролей
    const userRole = await prisma.role.findUnique({
      where: { name: 'USER' }
    });

    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' }
    });

    assert.ok(userRole);
    assert.ok(adminRole);

    // 2. Створення тестових користувачів
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: userEmail,
        password: 'test-password',
        roleId: userRole.id
      }
    });
    createdIds.push(user.id);

    const anotherUser = await prisma.user.create({
      data: {
        name: 'Another User',
        email: anotherEmail,
        password: 'test-password',
        roleId: userRole.id
      }
    });
    createdIds.push(anotherUser.id);

    const admin = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: adminEmail,
        password: 'test-password',
        roleId: adminRole.id
      }
    });
    createdIds.push(admin.id);

    // 3. Генерація токенів
    const userToken = generateAccessToken(user.id, 'USER');
    const adminToken = generateAccessToken(admin.id, 'ADMIN');

    // 4. USER не може переглядати список користувачів
    const userListResponse = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(userListResponse.status, 403);

    // 5. USER може переглядати власний профіль
    const ownProfileResponse = await request(app)
      .get(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(ownProfileResponse.status, 200);
    assert.equal(ownProfileResponse.body.email, userEmail);

    // 6. USER не може переглядати чужий профіль
    const чужийProfileResponse = await request(app)
      .get(`/api/users/${anotherUser.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(чужийProfileResponse.status, 403);

    // 7. ADMIN може переглядати список користувачів
    const adminListResponse = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminListResponse.status, 200);
    assert.ok(Array.isArray(adminListResponse.body));

    // 8. ADMIN може переглядати профіль іншого користувача
    const adminProfileResponse = await request(app)
      .get(`/api/users/${anotherUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminProfileResponse.status, 200);

    // 9. USER може змінювати власний профіль
    const ownUpdateResponse = await request(app)
      .put(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Updated Test User' });

    assert.equal(ownUpdateResponse.status, 200);
    assert.equal(ownUpdateResponse.body.name, 'Updated Test User');

    // 10. USER не може змінювати чужий профіль
    const чужийUpdateResponse = await request(app)
      .put(`/api/users/${anotherUser.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Unauthorized Update' });

    assert.equal(чужийUpdateResponse.status, 403);

    // 11. USER не може змінити власну роль
    const roleUpdateResponse = await request(app)
      .put(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ roleId: adminRole.id });

    assert.equal(roleUpdateResponse.status, 403);

    // Перевірка, що роль у БД не змінилася
    const unchangedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    assert.equal(unchangedUser.roleId, userRole.id);

    // 12. ADMIN може змінити чужий профіль
    const adminUpdateResponse = await request(app)
      .put(`/api/users/${anotherUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated By Admin' });

    assert.equal(adminUpdateResponse.status, 200);
    assert.equal(adminUpdateResponse.body.name, 'Updated By Admin');

    // 13. ADMIN може змінити роль користувача
    const adminRoleUpdateResponse = await request(app)
      .put(`/api/users/${anotherUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleId: adminRole.id });

    assert.equal(adminRoleUpdateResponse.status, 200);
    assert.equal(adminRoleUpdateResponse.body.roleId, adminRole.id);

    // 14. USER не може видалити чужий обліковий запис
    const userDeleteResponse = await request(app)
      .delete(`/api/users/${anotherUser.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(userDeleteResponse.status, 403);

    // 15. ADMIN може видалити користувача
    const adminDeleteResponse = await request(app)
      .delete(`/api/users/${anotherUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminDeleteResponse.status, 200);

    createdIds.splice(createdIds.indexOf(anotherUser.id), 1);

  } finally {
    // 16. Очищення тестових користувачів
    if (createdIds.length > 0) {
      await prisma.refreshToken.deleteMany({
        where: { userId: { in: createdIds } }
      });

      await prisma.user.deleteMany({
        where: { id: { in: createdIds } }
      });
    }
  }
});
