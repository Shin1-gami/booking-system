
import { io } from "socket.io-client";
import { prisma } from "../src/config/prisma.js";
import { verifyAccessToken } from "../src/utils/jwt.js";

const token = process.env.TEST_ACCESS_TOKEN;

if (!token) {
  console.error("Не задано TEST_ACCESS_TOKEN");
  process.exit(1);
}

let firstSocket;
let secondSocket;

function connectSocket() {
  return new Promise((resolve, reject) => {
    const socket = io("http://localhost:3000", {
      auth: { token },
      reconnection: false,
      timeout: 5000
    });

    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (error) => {
      socket.disconnect();
      reject(error);
    });
  });
}

function emitWithTimeout(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(event, payload, (error, response) => {
      if (error) {
        reject(new Error(`Тайм-аут очікування відповіді: ${event}`));
        return;
      }

      resolve(response);
    });
  });
}

async function disconnectSocket(socket) {
  if (!socket?.connected) return;

  await new Promise((resolve) => {
    socket.once("disconnect", resolve);
    socket.disconnect();
  });
}

async function main() {
  try {
    // Визначаємо ID користувача з токена
    const decoded = verifyAccessToken(token);
    const userId = Number(decoded.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error("Не вдалося визначити ID користувача з токена");
    }

    // 1. Перше підключення та отримання історії
    firstSocket = await connectSocket();

    console.log("Перше підключення встановлено");

    const initialHistory = await emitWithTimeout(
      firstSocket,
      "event:history",
      { afterId: 0, limit: 100 }
    );

    if (!initialHistory?.success) {
      throw new Error("Не вдалося отримати початкову історію");
    }

    const lastEvent = initialHistory.events.at(-1);
    const lastEventId = lastEvent?.id ?? 0;

    console.log("Останній отриманий ID:", lastEventId);

    // 2. Відключаємо користувача
    await disconnectSocket(firstSocket);
    console.log("Користувач відключився від Socket.IO");

    // 3. Створюємо подію без активного підключення користувача
    const offlineEvent = await prisma.userEvent.create({
      data: {
        userId,
        event: "test:offline-recovery",
        payload: {
          message: "Ця подія створена, поки користувач був офлайн",
          createdForTest: true
        }
      }
    });

    console.log("Поки користувач був офлайн, створено подію ID:", offlineEvent.id);

    // 4. Повторно підключаємо користувача
    secondSocket = await connectSocket();

    console.log("Повторне підключення встановлено");

    // 5. Запитуємо тільки події, яких ще не отримували
    const recoveredHistory = await emitWithTimeout(
      secondSocket,
      "event:history",
      {
        afterId: lastEventId,
        limit: 100
      }
    );

    if (!recoveredHistory?.success) {
      throw new Error("Не вдалося отримати історію після перепідключення");
    }

    console.log("\nОТРИМАНІ ПІСЛЯ ПЕРЕПІДКЛЮЧЕННЯ ПОДІЇ:");

    for (const event of recoveredHistory.events) {
      console.log({
        id: event.id,
        event: event.event,
        payload: event.payload
      });
    }

    // 6. Перевіряємо, чи повернулася саме пропущена подія
    const recoveredEvent = recoveredHistory.events.find(
      (event) => event.id === offlineEvent.id
    );

    if (!recoveredEvent) {
      throw new Error("Пропущену під час офлайну подію не відновлено");
    }

    console.log("\nТЕСТ ВІДНОВЛЕННЯ ПОДІЙ ПРОЙДЕНО");
  } catch (error) {
    console.error("\nПОМИЛКА ТЕСТУ:", error);
    process.exitCode = 1;
  } finally {
    await disconnectSocket(firstSocket);
    await disconnectSocket(secondSocket);
    await prisma.$disconnect();
  }
}

main();
