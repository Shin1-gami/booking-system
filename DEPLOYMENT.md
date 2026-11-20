# Розгортання Booking System

## 1. Вимоги до середовища

- Node.js 26 або сумісна версія.
- PostgreSQL.
- Redis Server.
- npm.

## 2. Встановлення залежностей

```bash
npm install
```

## 3. Налаштування середовища

Створити файл `.env` на основі `.env.example`.

Налаштувати:
- DATABASE_URL — підключення до PostgreSQL;
- REDIS_URL — підключення до Redis;
- JWT_SECRET та JWT_REFRESH_SECRET — секрети автентифікації;
- NODE_ENV=production;
- PORT — порт сервера.

Використовувати власні безпечні секрети. Не публікувати `.env`.

## 4. Підготовка бази даних

Застосувати наявні міграції Prisma:

```bash
npx prisma migrate deploy
```

## 5. Запуск Redis

Переконатися, що Redis Server запущений і доступний за адресою, зазначеною в REDIS_URL.

## 6. Запуск застосунку

```bash
npm start
```

## 7. Контроль працездатності

- GET /health — перевірка стану сервера та залежностей.
- GET /metrics — отримання метрик Prometheus.
- GET /api-docs — документація API.

## 8. Завершення роботи

Для коректного завершення локального процесу використовувати SIGINT або SIGTERM. Застосунок виконує Graceful Shutdown та закриває підключення до PostgreSQL, Redis, BullMQ і Socket.IO.