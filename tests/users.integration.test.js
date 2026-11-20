import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

describe('Users API Integration Tests', () => {
  let firstUserToken;
  let secondUserId;

  before(async () => {
    const firstRes = await request(app).post('/api/auth/register').send({
      name: 'First User',
      email: `first.user.${Date.now()}@test.com`,
      password: 'Password123!',
    });

    const secondRes = await request(app).post('/api/auth/register').send({
      name: 'Second User',
      email: `second.user.${Date.now()}@test.com`,
      password: 'Password123!',
    });

    firstUserToken = firstRes.body.accessToken;
    secondUserId = secondRes.body.user?.id || secondRes.body.data?.id;
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('повинен забороняти звичайному користувачу переглядати профіль іншого користувача', async () => {
    const otherUserProfileResponse = await request(app)
      .get(`/api/users/${secondUserId}`)
      .set('Authorization', `Bearer ${firstUserToken}`);

    assert.equal(otherUserProfileResponse.status, 403);
  });
});