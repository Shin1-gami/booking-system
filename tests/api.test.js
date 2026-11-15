
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import app from '../src/app.js';

test('GET / повинен повертати повідомлення про роботу API', async () => {
  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.equal(response.body.message, 'Booking System API працює');
});

test('GET /api/files без авторизації повинен повертати 401', async () => {
  const response = await request(app).get('/api/files');

  assert.equal(response.status, 401);
});

test('GET /api-docs повинен відкривати документацію Swagger', async () => {
  const response = await request(app).get('/api-docs/');

  assert.equal(response.status, 200);
});

test('POST /api/auth/register без даних повинен повертати помилку', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({});

  assert.ok(response.status >= 400 && response.status < 500);
});

test('POST /api/auth/login без даних повинен повертати помилку', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({});

  assert.ok(response.status >= 400 && response.status < 500);
});

test('POST /api/auth/refresh без токена повинен повертати помилку', async () => {
  const response = await request(app)
    .post('/api/auth/refresh')
    .send({});

  assert.ok(response.status >= 400 && response.status < 500);
});


test('GET /api/resources повинен бути доступним без авторизації', async () => {
  const response = await request(app).get('/api/resources');

  assert.equal(response.status, 200);
});

test('POST /api/resources без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .post('/api/resources')
    .send({});

  assert.equal(response.status, 401);
});

test('PUT /api/resources/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .put('/api/resources/1')
    .send({});

  assert.equal(response.status, 401);
});

test('DELETE /api/resources/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .delete('/api/resources/1');

  assert.equal(response.status, 401);
});


test('GET /api/bookings без авторизації повинен повертати 401', async () => {
  const response = await request(app).get('/api/bookings');

  assert.equal(response.status, 401);
});

test('GET /api/bookings/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app).get('/api/bookings/1');

  assert.equal(response.status, 401);
});

test('POST /api/bookings без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .post('/api/bookings')
    .send({
      resourceId: 1,
      startTime: '2026-12-01T10:00:00.000Z',
      endTime: '2026-12-01T12:00:00.000Z'
    });

  assert.equal(response.status, 401);
});

test('PUT /api/bookings/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .put('/api/bookings/1')
    .send({
      status: 'CANCELLED'
    });

  assert.equal(response.status, 401);
});

test('DELETE /api/bookings/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .delete('/api/bookings/1');

  assert.equal(response.status, 401);
});


test('GET /api/users без авторизації повинен повертати 401', async () => {
  const response = await request(app).get('/api/users');
  assert.equal(response.status, 401);
});

test('GET /api/users/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app).get('/api/users/1');
  assert.equal(response.status, 401);
});

test('POST /api/users без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      roleId: 1
    });

  assert.equal(response.status, 401);
});

test('PUT /api/users/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .put('/api/users/1')
    .send({ name: 'Updated User' });

  assert.equal(response.status, 401);
});

test('DELETE /api/users/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app).delete('/api/users/1');
  assert.equal(response.status, 401);
});


test('GET /api/categories повинен бути доступним без авторизації', async () => {
  const response = await request(app).get('/api/categories');
  assert.equal(response.status, 200);
});

test('GET /api/categories/1 повинен бути доступним без авторизації', async () => {
  const response = await request(app).get('/api/categories/1');
  assert.ok([200, 404].includes(response.status));
});

test('POST /api/categories без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .post('/api/categories')
    .send({
      name: 'Test Category',
      description: 'Test description'
    });

  assert.equal(response.status, 401);
});

test('PUT /api/categories/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .put('/api/categories/1')
    .send({ name: 'Updated Category' });

  assert.equal(response.status, 401);
});

test('DELETE /api/categories/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app).delete('/api/categories/1');
  assert.equal(response.status, 401);
});


test('GET /api/notifications без авторизації повинен повертати 401', async () => {
  const response = await request(app).get('/api/notifications');
  assert.equal(response.status, 401);
});

test('POST /api/notifications без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .post('/api/notifications')
    .send({
      userId: 1,
      message: 'Test notification'
    });

  assert.equal(response.status, 401);
});

test('PUT /api/notifications/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .put('/api/notifications/1')
    .send({ isRead: true });

  assert.equal(response.status, 401);
});

test('DELETE /api/notifications/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app).delete('/api/notifications/1');
  assert.equal(response.status, 401);
});

test('GET /api/favorites без авторизації повинен повертати 401', async () => {
  const response = await request(app).get('/api/favorites');

  assert.equal(response.status, 401);
});

test('POST /api/favorites без авторизації повинен повертати 401', async () => {
  const response = await request(app)
    .post('/api/favorites')
    .send({ resourceId: 1 });

  assert.equal(response.status, 401);
});

test('DELETE /api/favorites/1 без авторизації повинен повертати 401', async () => {
  const response = await request(app).delete('/api/favorites/1');

  assert.equal(response.status, 401);
});


test('POST /api/auth/register з некоректною поштою повинен повертати 400', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'invalid-email',
      password: 'Password123'
    });

  assert.equal(response.status, 400);
});

test('POST /api/auth/register з коротким паролем повинен повертати 400', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'test-short@example.com',
      password: '123'
    });

  assert.equal(response.status, 400);
});

test('POST /api/auth/register з коротким ім’ям повинен повертати 400', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'A',
      email: 'test-name@example.com',
      password: 'Password123'
    });

  assert.equal(response.status, 400);
});

test('POST /api/auth/login з неіснуючою поштою повинен повертати 401', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'nonexistent-user-987654@example.com',
      password: 'Password123'
    });

  assert.equal(response.status, 401);
});

test('POST /api/auth/refresh з некоректним токеном повинен повертати 401', async () => {
  const response = await request(app)
    .post('/api/auth/refresh')
    .send({
      refreshToken: 'invalid.refresh.token'
    });

  assert.equal(response.status, 401);
});
