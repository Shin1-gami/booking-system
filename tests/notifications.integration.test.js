import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

describe('Notifications API Integration Tests', () => {
  let adminToken;
  let targetUserId;

  before(async () => {
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Admin Tester',
      email: `admin.notif.${Date.now()}@test.com`,
      password: 'Password123!',
    });

    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Target User',
      email: `user.notif.${Date.now()}@test.com`,
      password: 'Password123!',
    });

    targetUserId = userRes.body.user?.id || userRes.body.data?.id;
    const adminId = adminRes.body.user?.id || adminRes.body.data?.id;

    await prisma.user.update({
      where: { id: adminId },
      data: {
        role: {
          connectOrCreate: {
            where: { name: 'ADMIN' },
            create: { name: 'ADMIN' },
          },
        },
      },
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: adminRes.body.user?.email || adminRes.body.data?.email,
      password: 'Password123!',
    });

    adminToken = loginRes.body.accessToken;
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('повинен створювати сповіщення із переданим пріоритетом та повертати обгортку data', async () => {
    const createdNotification = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: targetUserId,
        message: 'Тестове термінове сповіщення',
        priority: 'URGENT',
      });

    assert.equal(createdNotification.status, 201);
    assert.ok(createdNotification.body.data, 'Очікується обʼєкт data у відповіді');
    assert.equal(createdNotification.body.data.userId, targetUserId);
    assert.equal(createdNotification.body.data.priority, 'URGENT');
    assert.equal(createdNotification.body.data.message, 'Тестове термінове сповіщення');
  });
});