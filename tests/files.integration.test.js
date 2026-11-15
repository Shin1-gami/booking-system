
import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import app from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { generateAccessToken } from "../src/utils/jwt.js";

test("Інтеграційне тестування модуля файлів", async () => {
  const userRole = await prisma.role.findUnique({
    where: { name: "USER" }
  });

  const adminRole = await prisma.role.findUnique({
    where: { name: "ADMIN" }
  });

  assert.ok(userRole, "Роль USER повинна існувати");
  assert.ok(adminRole, "Роль ADMIN повинна існувати");

  const suffix = randomUUID();

  let user1;
  let user2;
  let admin;

  const createdFileIds = [];
  const uploadedFilePaths = [];

  try {
    // Створення тестових користувачів
    user1 = await prisma.user.create({
      data: {
        name: "Files Test User 1",
        email: `files-user1-${suffix}@test.com`,
        password: "test-password",
        roleId: userRole.id
      }
    });

    user2 = await prisma.user.create({
      data: {
        name: "Files Test User 2",
        email: `files-user2-${suffix}@test.com`,
        password: "test-password",
        roleId: userRole.id
      }
    });

    admin = await prisma.user.create({
      data: {
        name: "Files Test Admin",
        email: `files-admin-${suffix}@test.com`,
        password: "test-password",
        roleId: adminRole.id
      }
    });

    const user1Token = generateAccessToken(user1.id, "USER");
    const user2Token = generateAccessToken(user2.id, "USER");
    const adminToken = generateAccessToken(admin.id, "ADMIN");

    // Перевірка авторизації
    await request(app)
      .get("/api/files")
      .expect(401);

    await request(app)
      .post("/api/files/upload")
      .attach("file", Buffer.from("test"), "test.pdf")
      .expect(401);

    // Отримання порожнього списку
    const emptyList = await request(app)
      .get("/api/files")
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(200);

    assert.equal(emptyList.body.total, 0);
    assert.deepEqual(emptyList.body.files, []);

    // Завантаження PDF-файлу
    const uploadResponse = await request(app)
      .post("/api/files/upload")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", Buffer.from("%PDF-1.4 test file"), {
        filename: "test-document.pdf",
        contentType: "application/pdf"
      })
      .expect(201);

    const uploadedFile = uploadResponse.body.file;

    assert.ok(uploadedFile.id);
    assert.equal(uploadedFile.originalName, "test-document.pdf");
    assert.equal(uploadedFile.mimetype, "application/pdf");
    assert.equal(uploadedFile.uploadedBy, user1.id);

    createdFileIds.push(uploadedFile.id);
    uploadedFilePaths.push(uploadedFile.path);

    // Перевірка автоматично згенерованої назви
    assert.match(
      uploadedFile.filename,
      /^[0-9a-f-]+\.pdf$/i
    );

    // Перевірка наявності фізичного файлу
    await fs.access(uploadedFile.path);

    // Отримання списку власних файлів
    const userFiles = await request(app)
      .get("/api/files")
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(200);

    assert.equal(userFiles.body.total, 1);
    assert.equal(userFiles.body.files[0].id, uploadedFile.id);

    // Інший користувач не бачить чужих файлів
    const otherUserFiles = await request(app)
      .get("/api/files")
      .set("Authorization", `Bearer ${user2Token}`)
      .expect(200);

    assert.equal(otherUserFiles.body.total, 0);

    // Отримання інформації про власний файл
    const ownFile = await request(app)
      .get(`/api/files/${uploadedFile.id}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(200);

    assert.equal(ownFile.body.id, uploadedFile.id);

    // Інший користувач не може переглянути чужий файл
    await request(app)
      .get(`/api/files/${uploadedFile.id}`)
      .set("Authorization", `Bearer ${user2Token}`)
      .expect(403);

    // ADMIN може переглядати чужий файл
    await request(app)
      .get(`/api/files/${uploadedFile.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    // Перевірка неправильного ID
    await request(app)
      .get("/api/files/abc")
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(400);

    await request(app)
      .get("/api/files/0")
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(400);

    // Перевірка неіснуючого файлу
    await request(app)
      .get("/api/files/999999999")
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(404);

    // Завантаження без передавання файлу
    await request(app)
      .post("/api/files/upload")
      .set("Authorization", `Bearer ${user1Token}`)
      .field("description", "No file")
      .expect(400);

    // Заборонений формат
    await request(app)
      .post("/api/files/upload")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", Buffer.from("test"), {
        filename: "test.txt",
        contentType: "text/plain"
      })
      .expect(400);

    // Невідповідність MIME-типу та розширення
    await request(app)
      .post("/api/files/upload")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", Buffer.from("test"), {
        filename: "fake.pdf",
        contentType: "image/png"
      })
      .expect(400);

    // Перевищення максимального розміру 5 МБ
    const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);

    await request(app)
      .post("/api/files/upload")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", largeBuffer, {
        filename: "large.pdf",
        contentType: "application/pdf"
      })
      .expect(413);

    // Завантаження одного файлу забороняє другий
    await request(app)
      .post("/api/files/upload")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", Buffer.from("first"), {
        filename: "first.pdf",
        contentType: "application/pdf"
      })
      .attach("file", Buffer.from("second"), {
        filename: "second.pdf",
        contentType: "application/pdf"
      })
      .expect(400);

    // Інший користувач не може видалити чужий файл
    await request(app)
      .delete(`/api/files/${uploadedFile.id}`)
      .set("Authorization", `Bearer ${user2Token}`)
      .expect(403);

    // ADMIN може видалити чужий файл
    await request(app)
      .delete(`/api/files/${uploadedFile.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    // Перевірка видалення запису з бази даних
    const deletedFile = await prisma.file.findUnique({
      where: { id: uploadedFile.id }
    });

    assert.equal(deletedFile, null);

    // Перевірка видалення фізичного файлу
    await assert.rejects(
      fs.access(uploadedFile.path)
    );

    // Повторне видалення неіснуючого файлу
    await request(app)
      .delete(`/api/files/${uploadedFile.id}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(404);

    // Перевірка неправильного ID при видаленні
    await request(app)
      .delete("/api/files/abc")
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(400);

    // Перевірка видалення власного файлу
    const ownUpload = await request(app)
      .post("/api/files/upload")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", Buffer.from("%PDF-1.4 own file"), {
        filename: "own-file.pdf",
        contentType: "application/pdf"
      })
      .expect(201);

    createdFileIds.push(ownUpload.body.file.id);
    uploadedFilePaths.push(ownUpload.body.file.path);

    await request(app)
      .delete(`/api/files/${ownUpload.body.file.id}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(200);

    const ownDeletedFile = await prisma.file.findUnique({
      where: { id: ownUpload.body.file.id }
    });

    assert.equal(ownDeletedFile, null);

    // Перевірка доступу без авторизації до окремого файлу
    await request(app)
      .get(`/api/files/${ownUpload.body.file.id}`)
      .expect(401);

  } finally {
    // Очищення залишків тестових записів і фізичних файлів
    for (const fileId of createdFileIds) {
      await prisma.file.deleteMany({
        where: { id: fileId }
      });
    }

    for (const filePath of uploadedFilePaths) {
      await fs.unlink(filePath).catch(() => {});
    }

    const userIds = [user1?.id, user2?.id, admin?.id].filter(Boolean);

    if (userIds.length > 0) {
      await prisma.refreshToken.deleteMany({
        where: { userId: { in: userIds } }
      });

      await prisma.file.deleteMany({
        where: { uploadedBy: { in: userIds } }
      });

      await prisma.user.deleteMany({
        where: { id: { in: userIds } }
      });
    }
  }
});
