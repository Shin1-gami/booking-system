# Booking System

Backend-система для бронювання ресурсів.

## Технології

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- Zod

## Встановлення

1. Клонувати репозиторій.
2. Встановити залежності:

npm install

3. Створити файл .env та налаштувати DATABASE_URL.
4. Виконати міграції:

npx prisma migrate dev

5. Запустити сервер:

npm run dev

## API

- /api/users
- /api/categories
- /api/resources
- /api/bookings
- /api/notifications
- /api/favorites