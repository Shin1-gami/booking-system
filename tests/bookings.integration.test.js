
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';

test('Перевірка бронювань, CRUD, конфліктів часу та прав доступу', async () => {
  const suffix = randomUUID();

  const createdUserIds = [];
  let categoryId;
  let resourceId;

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

    // 2. Створення тестової категорії
    const category = await prisma.category.create({
      data: {
        name: `Booking Category ${suffix}`
      }
    });

    categoryId = category.id;

    // 3. Створення тестового ресурсу
    const resource = await prisma.resource.create({
      data: {
        name: `Booking Resource ${suffix}`,
        description: 'Resource for booking integration tests',
        location: 'Test City',
        price: 100,
        categoryId
      }
    });

    resourceId = resource.id;

    // 4. Створення тестових користувачів
    const user = await prisma.user.create({
      data: {
        name: 'Booking Test User',
        email: `booking-user-${suffix}@example.com`,
        password: 'test-password',
        roleId: userRole.id
      }
    });

    createdUserIds.push(user.id);

    const anotherUser = await prisma.user.create({
      data: {
        name: 'Another Booking User',
        email: `booking-another-${suffix}@example.com`,
        password: 'test-password',
        roleId: userRole.id
      }
    });

    createdUserIds.push(anotherUser.id);

    const admin = await prisma.user.create({
      data: {
        name: 'Booking Test Admin',
        email: `booking-admin-${suffix}@example.com`,
        password: 'test-password',
        roleId: adminRole.id
      }
    });

    createdUserIds.push(admin.id);

    const userToken = generateAccessToken(user.id, 'USER');
    const anotherUserToken = generateAccessToken(anotherUser.id, 'USER');
    const adminToken = generateAccessToken(admin.id, 'ADMIN');

    // 5. Підготовка дат
    const baseTime = Date.now() + 24 * 60 * 60 * 1000;

    const startTime = new Date(baseTime);
    const endTime = new Date(baseTime + 60 * 60 * 1000);

    const secondStartTime = new Date(baseTime + 2 * 60 * 60 * 1000);
    const secondEndTime = new Date(baseTime + 3 * 60 * 60 * 1000);

    const thirdStartTime = new Date(baseTime + 4 * 60 * 60 * 1000);
    const thirdEndTime = new Date(baseTime + 5 * 60 * 60 * 1000);

    // 6. Перевірка створення без авторизації
    const unauthorizedCreate = await request(app)
      .post('/api/bookings')
      .send({
        resourceId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

    assert.equal(unauthorizedCreate.status, 401);

    // 7. Створення бронювання першим користувачем
    const createResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        resourceId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

    assert.equal(createResponse.status, 201);
    assert.equal(createResponse.body.userId, user.id);
    assert.equal(createResponse.body.resourceId, resourceId);
    assert.equal(createResponse.body.status, 'PENDING');

    const firstBooking = createResponse.body;

    // 8. Перевірка конфлікту часу
    const conflictResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${anotherUserToken}`)
      .send({
        resourceId,
        startTime: new Date(baseTime + 30 * 60 * 1000).toISOString(),
        endTime: new Date(baseTime + 90 * 60 * 1000).toISOString()
      });

    assert.equal(conflictResponse.status, 409);

    // 9. Створення другого бронювання в іншому часовому проміжку
    const secondCreateResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${anotherUserToken}`)
      .send({
        resourceId,
        startTime: secondStartTime.toISOString(),
        endTime: secondEndTime.toISOString()
      });

    assert.equal(secondCreateResponse.status, 201);
    assert.equal(secondCreateResponse.body.userId, anotherUser.id);

    const secondBooking = secondCreateResponse.body;

    // 10. Перевірка некоректних дат
    const invalidDatesResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        resourceId,
        startTime: endTime.toISOString(),
        endTime: startTime.toISOString()
      });

    assert.equal(invalidDatesResponse.status, 400);

    // 11. Перевірка неіснуючого ресурсу
    const missingResourceResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        resourceId: 999999999,
        startTime: thirdStartTime.toISOString(),
        endTime: thirdEndTime.toISOString()
      });

    assert.equal(missingResourceResponse.status, 404);

    // 12. Перевірка некоректного resourceId
    const invalidResourceResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        resourceId: -1,
        startTime: thirdStartTime.toISOString(),
        endTime: thirdEndTime.toISOString()
      });

    assert.equal(invalidResourceResponse.status, 400);

    // 13. USER бачить тільки власні бронювання
    const userListResponse = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(userListResponse.status, 200);
    assert.ok(Array.isArray(userListResponse.body));
    assert.ok(
      userListResponse.body.some(item => item.id === firstBooking.id)
    );
    assert.ok(
      !userListResponse.body.some(item => item.id === secondBooking.id)
    );

    // 14. ADMIN бачить усі бронювання
    const adminListResponse = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminListResponse.status, 200);
    assert.ok(
      adminListResponse.body.some(item => item.id === firstBooking.id)
    );
    assert.ok(
      adminListResponse.body.some(item => item.id === secondBooking.id)
    );

    // 15. Перегляд власного бронювання
    const ownBookingResponse = await request(app)
      .get(`/api/bookings/${firstBooking.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(ownBookingResponse.status, 200);
    assert.equal(ownBookingResponse.body.id, firstBooking.id);

    // 16. USER не може переглядати чуже бронювання
    const forbiddenGetResponse = await request(app)
      .get(`/api/bookings/${secondBooking.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(forbiddenGetResponse.status, 403);

    // 17. ADMIN може переглядати чуже бронювання
    const adminGetResponse = await request(app)
      .get(`/api/bookings/${secondBooking.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminGetResponse.status, 200);

    // 18. Перевірка некоректного ID
    const invalidIdResponse = await request(app)
      .get('/api/bookings/abc')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(invalidIdResponse.status, 400);

    // 19. Перевірка неіснуючого бронювання
    const missingBookingResponse = await request(app)
      .get('/api/bookings/999999999')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(missingBookingResponse.status, 404);

    // 20. USER може змінити час власного бронювання
    const userUpdateResponse = await request(app)
      .put(`/api/bookings/${firstBooking.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        startTime: thirdStartTime.toISOString(),
        endTime: thirdEndTime.toISOString()
      });

    assert.equal(userUpdateResponse.status, 200);
    assert.equal(
      new Date(userUpdateResponse.body.startTime).getTime(),
      thirdStartTime.getTime()
    );

    // 21. USER не може змінювати статус бронювання
    const forbiddenStatusResponse = await request(app)
      .put(`/api/bookings/${firstBooking.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        status: 'CONFIRMED'
      });

    assert.equal(forbiddenStatusResponse.status, 403);

    // 22. ADMIN може змінювати статус бронювання
    const adminUpdateResponse = await request(app)
      .put(`/api/bookings/${firstBooking.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'CONFIRMED'
      });

    assert.equal(adminUpdateResponse.status, 200);
    assert.equal(adminUpdateResponse.body.status, 'CONFIRMED');

    // 23. Перевірка некоректного статусу
    const invalidStatusResponse = await request(app)
      .put(`/api/bookings/${firstBooking.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'INVALID_STATUS'
      });

    assert.equal(invalidStatusResponse.status, 400);

    // 24. Перевірка конфлікту під час оновлення
    const updateConflictResponse = await request(app)
      .put(`/api/bookings/${firstBooking.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        startTime: secondStartTime.toISOString(),
        endTime: secondEndTime.toISOString()
      });

    assert.equal(updateConflictResponse.status, 409);

    // 25. USER не може змінити чуже бронювання
    const forbiddenUpdateResponse = await request(app)
      .put(`/api/bookings/${secondBooking.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        startTime: thirdStartTime.toISOString(),
        endTime: thirdEndTime.toISOString()
      });

    assert.equal(forbiddenUpdateResponse.status, 403);

    // 26. Перевірка некоректного ID під час оновлення
    const invalidUpdateIdResponse = await request(app)
      .put('/api/bookings/abc')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        status: 'CONFIRMED'
      });

    assert.equal(invalidUpdateIdResponse.status, 400);

    // 27. Перевірка видалення без авторизації
    const unauthorizedDeleteResponse = await request(app)
      .delete(`/api/bookings/${firstBooking.id}`);

    assert.equal(unauthorizedDeleteResponse.status, 401);

    // 28. USER не може видалити чуже бронювання
    const forbiddenDeleteResponse = await request(app)
      .delete(`/api/bookings/${secondBooking.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(forbiddenDeleteResponse.status, 403);

    // 29. USER може видалити власне бронювання
    const userDeleteResponse = await request(app)
      .delete(`/api/bookings/${firstBooking.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(userDeleteResponse.status, 200);

    // 30. ADMIN може видалити чуже бронювання
    const adminDeleteResponse = await request(app)
      .delete(`/api/bookings/${secondBooking.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminDeleteResponse.status, 200);

    // 31. Перевірка видалення неіснуючого бронювання
    const missingDeleteResponse = await request(app)
      .delete('/api/bookings/999999999')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(missingDeleteResponse.status, 404);

    // 32. Перевірка некоректного ID під час видалення
    const invalidDeleteIdResponse = await request(app)
      .delete('/api/bookings/abc')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(invalidDeleteIdResponse.status, 400);

  } finally {
    // 33. Очищення тестових бронювань
    if (createdUserIds.length > 0) {
      await prisma.booking.deleteMany({
        where: {
          userId: {
            in: createdUserIds
          }
        }
      });
    }

    // Додаткове очищення бронювань тестового ресурсу
    if (resourceId !== undefined) {
      await prisma.booking.deleteMany({
        where: { resourceId }
      });

      await prisma.resource.deleteMany({
        where: { id: resourceId }
      });
    }

    // Видалення тестової категорії
    if (categoryId !== undefined) {
      await prisma.category.deleteMany({
        where: { id: categoryId }
      });
    }

    // Видалення тестових користувачів
    if (createdUserIds.length > 0) {
      await prisma.refreshToken.deleteMany({
        where: {
          userId: {
            in: createdUserIds
          }
        }
      });

      await prisma.user.deleteMany({
        where: {
          id: {
            in: createdUserIds
          }
        }
      });
    }
  }
});
