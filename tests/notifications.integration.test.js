
import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { generateAccessToken } from "../src/utils/jwt.js";

test("Інтеграційне тестування модуля сповіщень", async () => {
  const suffix = randomUUID();

  const createdUserIds = [];
  const notificationIds = [];

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
        name: "Notification User 1",
        email: `notification-user1-${suffix}@example.com`,
        password: "test-password",
        roleId: userRole.id
      }
    });

    createdUserIds.push(user1.id);

    const user2 = await prisma.user.create({
      data: {
        name: "Notification User 2",
        email: `notification-user2-${suffix}@example.com`,
        password: "test-password",
        roleId: userRole.id
      }
    });

    createdUserIds.push(user2.id);

    const admin = await prisma.user.create({
      data: {
        name: "Notification Admin",
        email: `notification-admin-${suffix}@example.com`,
        password: "test-password",
        roleId: adminRole.id
      }
    });

    createdUserIds.push(admin.id);

    const userToken = generateAccessToken(user1.id, "USER");
    const secondUserToken = generateAccessToken(user2.id, "USER");
    const adminToken = generateAccessToken(admin.id, "ADMIN");

    // Створення початкових сповіщень
    const notification1 = await prisma.notification.create({
      data: {
        userId: user1.id,
        message: "Сповіщення першого користувача"
      }
    });

    notificationIds.push(notification1.id);

    const notification2 = await prisma.notification.create({
      data: {
        userId: user2.id,
        message: "Сповіщення другого користувача"
      }
    });

    notificationIds.push(notification2.id);

    // GET: отримання сповіщень без авторизації
    const unauthorizedGet = await request(app)
      .get("/api/notifications");

    assert.equal(unauthorizedGet.status, 401);

    // GET: USER бачить тільки власні сповіщення
    const userNotifications = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(userNotifications.status, 200);
    assert.ok(Array.isArray(userNotifications.body));
    assert.ok(
      userNotifications.body.every(item => item.userId === user1.id)
    );
    assert.ok(
      userNotifications.body.some(item => item.id === notification1.id)
    );
    assert.ok(
      !userNotifications.body.some(item => item.id === notification2.id)
    );

    // GET: USER не може отримати сповіщення іншого користувача через userId
    const userFilter = await request(app)
      .get(`/api/notifications?userId=${user2.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(userFilter.status, 200);
    assert.ok(userFilter.body.every(item => item.userId === user1.id));

    // GET: ADMIN бачить усі сповіщення
    const adminNotifications = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(adminNotifications.status, 200);
    assert.ok(
      adminNotifications.body.some(item => item.id === notification1.id)
    );
    assert.ok(
      adminNotifications.body.some(item => item.id === notification2.id)
    );

    // GET: ADMIN фільтрує сповіщення за userId
    const adminFilter = await request(app)
      .get(`/api/notifications?userId=${user2.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(adminFilter.status, 200);
    assert.ok(adminFilter.body.every(item => item.userId === user2.id));

    // GET: ADMIN отримує помилку при некоректному userId
    const invalidFilter = await request(app)
      .get("/api/notifications?userId=abc")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(invalidFilter.status, 400);

    // POST: USER не може створювати сповіщення
    const forbiddenCreate = await request(app)
      .post("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        userId: user1.id,
        message: "Тестове сповіщення"
      });

    assert.equal(forbiddenCreate.status, 403);

    // POST: ADMIN створює сповіщення
    const createdNotification = await request(app)
      .post("/api/notifications")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: user1.id,
        message: "Створене адміністратором сповіщення"
      });

    assert.equal(createdNotification.status, 201);
    assert.equal(createdNotification.body.userId, user1.id);
    assert.equal(
      createdNotification.body.message,
      "Створене адміністратором сповіщення"
    );

    notificationIds.push(createdNotification.body.id);

    // POST: ADMIN не може створити сповіщення з некоректними даними
    const invalidCreate = await request(app)
      .post("/api/notifications")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: -1,
        message: ""
      });

    assert.equal(invalidCreate.status, 400);

    // POST: без авторизації
    const unauthorizedCreate = await request(app)
      .post("/api/notifications")
      .send({
        userId: user1.id,
        message: "Без авторизації"
      });

    assert.equal(unauthorizedCreate.status, 401);

    // PUT: USER позначає власне сповіщення як прочитане
    const markAsRead = await request(app)
      .put(`/api/notifications/${notification1.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        isRead: true
      });

    assert.equal(markAsRead.status, 200);
    assert.equal(markAsRead.body.isRead, true);

    // PUT: USER не може змінювати текст сповіщення
    const forbiddenMessageUpdate = await request(app)
      .put(`/api/notifications/${notification1.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        message: "Змінений текст"
      });

    assert.equal(forbiddenMessageUpdate.status, 403);

    // PUT: USER не може змінювати чуже сповіщення
    const forbiddenOtherUpdate = await request(app)
      .put(`/api/notifications/${notification2.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        isRead: true
      });

    assert.equal(forbiddenOtherUpdate.status, 403);

    // PUT: ADMIN змінює текст сповіщення
    const adminUpdate = await request(app)
      .put(`/api/notifications/${notification2.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        message: "Оновлений текст адміністратором",
        isRead: true
      });

    assert.equal(adminUpdate.status, 200);
    assert.equal(
      adminUpdate.body.message,
      "Оновлений текст адміністратором"
    );
    assert.equal(adminUpdate.body.isRead, true);

    // PUT: порожнє тіло запиту
    const emptyUpdate = await request(app)
      .put(`/api/notifications/${notification1.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    assert.equal(emptyUpdate.status, 400);

    // PUT: некоректний тип isRead
    const invalidUpdate = await request(app)
      .put(`/api/notifications/${notification1.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        isRead: "true"
      });

    assert.equal(invalidUpdate.status, 400);

    // PUT: неіснуюче сповіщення
    const missingUpdate = await request(app)
      .put("/api/notifications/999999999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        isRead: true
      });

    assert.equal(missingUpdate.status, 404);

    // PUT: некоректний ID
    const invalidIdUpdate = await request(app)
      .put("/api/notifications/abc")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        isRead: true
      });

    assert.equal(invalidIdUpdate.status, 400);

    // DELETE: USER не може видаляти чуже сповіщення
    const forbiddenDelete = await request(app)
      .delete(`/api/notifications/${notification2.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(forbiddenDelete.status, 403);

    // DELETE: USER видаляє власне сповіщення
    const userDelete = await request(app)
      .delete(`/api/notifications/${notification1.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(userDelete.status, 200);

    // DELETE: ADMIN видаляє сповіщення іншого користувача
    const adminDelete = await request(app)
      .delete(`/api/notifications/${notification2.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(adminDelete.status, 200);

    // DELETE: неіснуюче сповіщення
    const missingDelete = await request(app)
      .delete("/api/notifications/999999999")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(missingDelete.status, 404);

    // DELETE: некоректний ID
    const invalidIdDelete = await request(app)
      .delete("/api/notifications/abc")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(invalidIdDelete.status, 400);

    // DELETE: без авторизації
    const unauthorizedDelete = await request(app)
      .delete(`/api/notifications/${createdNotification.body.id}`);

    assert.equal(unauthorizedDelete.status, 401);

  } finally {
    // Очищення тестових даних
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { id: { in: notificationIds } },
          { userId: { in: createdUserIds } }
        ]
      }
    });

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
