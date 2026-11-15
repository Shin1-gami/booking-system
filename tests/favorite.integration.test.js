
import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { generateAccessToken } from "../src/utils/jwt.js";

test("Перевірка обраного, CRUD та прав доступу користувачів", async () => {
  const suffix = randomUUID();

  const createdUserIds = [];
  const createdResourceIds = [];
  const createdCategoryIds = [];

  try {
    const userRole = await prisma.role.findUnique({
      where: { name: "USER" }
    });

    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" }
    });

    assert.ok(userRole, "Роль USER повинна існувати");
    assert.ok(adminRole, "Роль ADMIN повинна існувати");

    const user1 = await prisma.user.create({
      data: {
        name: "Favorite User 1",
        email: `favorite-user1-${suffix}@example.com`,
        password: "test-password",
        roleId: userRole.id
      }
    });

    createdUserIds.push(user1.id);

    const user2 = await prisma.user.create({
      data: {
        name: "Favorite User 2",
        email: `favorite-user2-${suffix}@example.com`,
        password: "test-password",
        roleId: userRole.id
      }
    });

    createdUserIds.push(user2.id);

    const admin = await prisma.user.create({
      data: {
        name: "Favorite Admin",
        email: `favorite-admin-${suffix}@example.com`,
        password: "test-password",
        roleId: adminRole.id
      }
    });

    createdUserIds.push(admin.id);

    const userToken = generateAccessToken(user1.id, "USER");
    const secondUserToken = generateAccessToken(user2.id, "USER");
    const adminToken = generateAccessToken(admin.id, "ADMIN");

    // Створення тестової категорії
    const category = await prisma.category.create({
      data: {
        name: `Favorite Category ${suffix}`
      }
    });

    createdCategoryIds.push(category.id);

    // Створення тестових ресурсів
    const resource1 = await prisma.resource.create({
      data: {
        name: "Favorite Resource 1",
        description: "Test resource",
        location: "Lutsk",
        price: 100,
        categoryId: category.id
      }
    });

    createdResourceIds.push(resource1.id);

    const resource2 = await prisma.resource.create({
      data: {
        name: "Favorite Resource 2",
        description: "Test resource",
        location: "Lutsk",
        price: 200,
        categoryId: category.id
      }
    });

    createdResourceIds.push(resource2.id);

    // GET: без авторизації
    const unauthorizedGet = await request(app)
      .get("/api/favorites");

    assert.equal(unauthorizedGet.status, 401);

    // POST: без авторизації
    const unauthorizedPost = await request(app)
      .post("/api/favorites")
      .send({
        resourceId: resource1.id
      });

    assert.equal(unauthorizedPost.status, 401);

    // DELETE: без авторизації
    const unauthorizedDelete = await request(app)
      .delete(`/api/favorites/${resource1.id}`);

    assert.equal(unauthorizedDelete.status, 401);

    // GET: початковий список обраного користувача
    const initialFavorites = await request(app)
      .get("/api/favorites")
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(initialFavorites.status, 200);
    assert.ok(Array.isArray(initialFavorites.body));

    // POST: додавання першого ресурсу до обраного
    const createdFavorite = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        resourceId: resource1.id
      });

    assert.equal(createdFavorite.status, 201);
    assert.equal(createdFavorite.body.favorite.userId, user1.id);
    assert.equal(
      createdFavorite.body.favorite.resourceId,
      resource1.id
    );
    assert.equal(
      createdFavorite.body.favorite.resource.name,
      resource1.name
    );

    // POST: додавання другого ресурсу до обраного
    const secondFavorite = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        resourceId: resource2.id
      });

    assert.equal(secondFavorite.status, 201);
    assert.equal(
      secondFavorite.body.favorite.resourceId,
      resource2.id
    );

    // GET: користувач отримує власне обране
    const userFavorites = await request(app)
      .get("/api/favorites")
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(userFavorites.status, 200);
    assert.ok(Array.isArray(userFavorites.body));

    assert.equal(
      userFavorites.body.length,
      2
    );

    assert.ok(
      userFavorites.body.every(item => item.userId === user1.id)
    );

    assert.ok(
      userFavorites.body.every(item => item.resource.category.id === category.id)
    );

    assert.ok(
      userFavorites.body.some(item => item.resourceId === resource1.id)
    );

    assert.ok(
      userFavorites.body.some(item => item.resourceId === resource2.id)
    );

    // GET: другий користувач не бачить чуже обране
    const secondUserFavorites = await request(app)
      .get("/api/favorites")
      .set("Authorization", `Bearer ${secondUserToken}`);

    assert.equal(secondUserFavorites.status, 200);
    assert.ok(Array.isArray(secondUserFavorites.body));
    assert.equal(secondUserFavorites.body.length, 0);

    // POST: некоректний resourceId
    const invalidFavorite = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        resourceId: -1
      });

    assert.equal(invalidFavorite.status, 400);

    // POST: відсутній resourceId
    const missingResourceId = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    assert.equal(missingResourceId.status, 400);

    // POST: resourceId неправильного типу
    const invalidResourceType = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        resourceId: "abc"
      });

    assert.equal(invalidResourceType.status, 400);

    // POST: неіснуючий ресурс
    const nonexistentResource = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        resourceId: 999999999
      });

    assert.equal(nonexistentResource.status, 409);

    // POST: повторне додавання того самого ресурсу
    const duplicateFavorite = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        resourceId: resource1.id
      });

    assert.equal(duplicateFavorite.status, 409);

    // DELETE: некоректний ID
    const invalidDelete = await request(app)
      .delete("/api/favorites/abc")
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(invalidDelete.status, 400);

    // DELETE: нульовий ID
    const zeroDelete = await request(app)
      .delete("/api/favorites/0")
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(zeroDelete.status, 400);

    // DELETE: ресурс відсутній в обраному користувача
    const missingFavorite = await request(app)
      .delete(`/api/favorites/${resource2.id}`)
      .set("Authorization", `Bearer ${secondUserToken}`);

    assert.equal(missingFavorite.status, 404);

    // DELETE: користувач видаляє власний ресурс з обраного
    const deletedFavorite = await request(app)
      .delete(`/api/favorites/${resource1.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(deletedFavorite.status, 200);

    // GET: перевірка після видалення
    const favoritesAfterDelete = await request(app)
      .get("/api/favorites")
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(favoritesAfterDelete.status, 200);
    assert.equal(favoritesAfterDelete.body.length, 1);
    assert.equal(
      favoritesAfterDelete.body[0].resourceId,
      resource2.id
    );

    // DELETE: повторне видалення
    const repeatedDelete = await request(app)
      .delete(`/api/favorites/${resource1.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(repeatedDelete.status, 404);

  } finally {
    // Видалення тестових записів обраного
    await prisma.favorite.deleteMany({
      where: {
        OR: [
          { userId: { in: createdUserIds } },
          { resourceId: { in: createdResourceIds } }
        ]
      }
    });

    // Видалення тестових ресурсів
    await prisma.resource.deleteMany({
      where: {
        id: { in: createdResourceIds }
      }
    });

    // Видалення тестової категорії
    await prisma.category.deleteMany({
      where: {
        id: { in: createdCategoryIds }
      }
    });

    // Видалення токенів і тестових користувачів
    await prisma.refreshToken.deleteMany({
      where: {
        userId: { in: createdUserIds }
      }
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: createdUserIds }
      }
    });
  }
});
