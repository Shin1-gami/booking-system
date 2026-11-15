
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';

test('Перевірка ресурсів, CRUD, пошуку, фільтрації та прав доступу', async () => {
  const suffix = randomUUID();

  const createdUserIds = [];
  let categoryId;

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
        name: `Test Category ${suffix}`
      }
    });

    categoryId = category.id;

    // 3. Створення тестових користувачів
    const user = await prisma.user.create({
      data: {
        name: 'Resource Test User',
        email: `resource-user-${suffix}@example.com`,
        password: 'test-password',
        roleId: userRole.id
      }
    });

    createdUserIds.push(user.id);

    const admin = await prisma.user.create({
      data: {
        name: 'Resource Test Admin',
        email: `resource-admin-${suffix}@example.com`,
        password: 'test-password',
        roleId: adminRole.id
      }
    });

    createdUserIds.push(admin.id);

    const userToken = generateAccessToken(user.id, 'USER');
    const adminToken = generateAccessToken(admin.id, 'ADMIN');

    // 4. Перевірка доступу без авторизації
    const unauthorizedCreate = await request(app)
      .post('/api/resources')
      .send({
        name: 'Unauthorized Resource',
        location: 'Test City',
        price: 100,
        categoryId
      });

    assert.equal(unauthorizedCreate.status, 401);

    // 5. USER не може створювати ресурси
    const userCreate = await request(app)
      .post('/api/resources')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Forbidden Resource',
        location: 'Test City',
        price: 100,
        categoryId
      });

    assert.equal(userCreate.status, 403);

    // 6. ADMIN створює три ресурси
    const resourceData = [
      {
        name: `Test Resource A ${suffix}`,
        description: 'First test resource',
        location: 'Test City',
        price: 100,
        categoryId
      },
      {
        name: `Test Resource B ${suffix}`,
        description: 'Second test resource',
        location: 'Test City',
        price: 200,
        categoryId
      },
      {
        name: `Test Resource C ${suffix}`,
        description: 'Third test resource',
        location: 'Other City',
        price: 300,
        categoryId
      }
    ];

    const createdResources = [];

    for (const data of resourceData) {
      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      assert.equal(response.status, 201);
      assert.equal(response.body.name, data.name);

      createdResources.push(response.body);
    }

    const resourceA = createdResources[0];
    const resourceB = createdResources[1];
    const resourceC = createdResources[2];

    // 7. Перевірка публічного отримання списку ресурсів
    const listResponse = await request(app)
      .get('/api/resources');

    assert.equal(listResponse.status, 200);
    assert.ok(Array.isArray(listResponse.body.data));
    assert.ok(listResponse.body.pagination);

    // 8. Отримання ресурсу за ID
    const byIdResponse = await request(app)
      .get(`/api/resources/${resourceA.id}`);

    assert.equal(byIdResponse.status, 200);
    assert.equal(byIdResponse.body.id, resourceA.id);

    // 9. Перевірка пошуку за назвою
    const searchResponse = await request(app)
      .get('/api/resources')
      .query({ search: resourceA.name });

    assert.equal(searchResponse.status, 200);
    assert.ok(
      searchResponse.body.data.some(item => item.id === resourceA.id)
    );

    // 10. Фільтрація за категорією
    const categoryResponse = await request(app)
      .get('/api/resources')
      .query({ categoryId });

    assert.equal(categoryResponse.status, 200);
    assert.ok(
      categoryResponse.body.data.some(item => item.id === resourceA.id)
    );

    // 11. Фільтрація за мінімальною та максимальною ціною
    const priceResponse = await request(app)
      .get('/api/resources')
      .query({
        categoryId,
        minPrice: 150,
        maxPrice: 250
      });

    assert.equal(priceResponse.status, 200);
    assert.ok(
      priceResponse.body.data.some(item => item.id === resourceB.id)
    );
    assert.ok(
      !priceResponse.body.data.some(item => item.id === resourceA.id)
    );

    // 12. Фільтрація за місцем розташування
    const locationResponse = await request(app)
      .get('/api/resources')
      .query({
        categoryId,
        location: 'Other City'
      });

    assert.equal(locationResponse.status, 200);
    assert.ok(
      locationResponse.body.data.some(item => item.id === resourceC.id)
    );

    // 13. Сортування за ціною
    const sortResponse = await request(app)
      .get('/api/resources')
      .query({
        categoryId,
        sortBy: 'price',
        order: 'asc'
      });

    assert.equal(sortResponse.status, 200);

    const sortedPrices = sortResponse.body.data.map(item => item.price);

    assert.deepEqual(
      sortedPrices,
      [...sortedPrices].sort((a, b) => a - b)
    );

    // 14. Перевірка пагінації
    const paginationResponse = await request(app)
      .get('/api/resources')
      .query({
        categoryId,
        page: 1,
        limit: 1
      });

    assert.equal(paginationResponse.status, 200);
    assert.equal(paginationResponse.body.data.length, 1);
    assert.equal(paginationResponse.body.pagination.total, 3);
    assert.equal(paginationResponse.body.pagination.totalPages, 3);

    // 15. Перевірка некоректних параметрів
    const invalidPageResponse = await request(app)
      .get('/api/resources')
      .query({ page: 0 });

    assert.equal(invalidPageResponse.status, 400);

    const invalidCategoryResponse = await request(app)
      .get('/api/resources')
      .query({ categoryId: 'invalid' });

    assert.equal(invalidCategoryResponse.status, 400);

    const invalidSortResponse = await request(app)
      .get('/api/resources')
      .query({ sortBy: 'password' });

    assert.equal(invalidSortResponse.status, 400);

    const invalidPriceResponse = await request(app)
      .get('/api/resources')
      .query({
        minPrice: 300,
        maxPrice: 100
      });

    assert.equal(invalidPriceResponse.status, 400);

    // 16. Перевірка неіснуючого ресурсу
    const missingResponse = await request(app)
      .get('/api/resources/999999999');

    assert.equal(missingResponse.status, 404);

    // 17. Перевірка некоректного ID
    const invalidIdResponse = await request(app)
      .get('/api/resources/abc');

    assert.equal(invalidIdResponse.status, 400);

    // 18. ADMIN може оновлювати ресурс
    const adminUpdate = await request(app)
      .put(`/api/resources/${resourceA.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Updated Resource ${suffix}`,
        price: 150
      });

    assert.equal(adminUpdate.status, 200);
    assert.equal(adminUpdate.body.price, 150);

    // 19. USER не може оновлювати ресурс
    const userUpdate = await request(app)
      .put(`/api/resources/${resourceB.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Forbidden Update'
      });

    assert.equal(userUpdate.status, 403);

    // 20. Перевірка валідації при створенні
    const invalidCreate = await request(app)
      .post('/api/resources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Invalid Resource',
        location: 'Test City',
        price: -10,
        categoryId
      });

    assert.equal(invalidCreate.status, 400);

    // 21. USER не може видаляти ресурс
    const userDelete = await request(app)
      .delete(`/api/resources/${resourceC.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(userDelete.status, 403);

    // 22. ADMIN може видаляти ресурс
    const adminDelete = await request(app)
      .delete(`/api/resources/${resourceC.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminDelete.status, 200);

  } finally {
    // 23. Очищення тестових даних
    if (categoryId !== undefined) {
      await prisma.resource.deleteMany({
        where: { categoryId }
      });

      await prisma.category.deleteMany({
        where: { id: categoryId }
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.refreshToken.deleteMany({
        where: { userId: { in: createdUserIds } }
      });

      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } }
      });
    }
  }
});
