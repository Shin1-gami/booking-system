
import { io } from "socket.io-client";

const token = process.env.TEST_ACCESS_TOKEN;

if (!token) {
  console.error("Не задано TEST_ACCESS_TOKEN");
  process.exit(1);
}

const socket = io("http://localhost:3000", {
  auth: { token },
  reconnection: false
});

function emitWithTimeout(event, payload) {
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

socket.on("connect", async () => {
  try {
    console.log("Підключення до Socket.IO успішне");

    // 1. Отримуємо історію подій
    const history = await emitWithTimeout("event:history", {
      afterId: 0,
      limit: 20
    });

    if (!history?.success) {
      throw new Error("Не вдалося отримати історію подій");
    }

    console.log("\nІСТОРІЮ ОТРИМАНО");
    console.log("Кількість подій:", history.events.length);

    if (history.events.length === 0) {
      throw new Error("Немає подій для перевірки event:ack");
    }

    // 2. Вибираємо першу подію
    const eventId = history.events[0].id;

    console.log("ID події для підтвердження:", eventId);

    // 3. Підтверджуємо отримання події
    const firstAck = await emitWithTimeout("event:ack", {
      eventId
    });

    console.log("\nПЕРШЕ ПІДТВЕРДЖЕННЯ:");
    console.log(firstAck);

    if (!firstAck?.success) {
      throw new Error("Перше підтвердження не пройшло");
    }

    // 4. Повторно підтверджуємо ту саму подію
    const secondAck = await emitWithTimeout("event:ack", {
      eventId
    });

    console.log("\nПОВТОРНЕ ПІДТВЕРДЖЕННЯ:");
    console.log(secondAck);

    if (
      !secondAck?.success ||
      !secondAck?.alreadyAcknowledged
    ) {
      throw new Error("Перевірка повторного підтвердження не пройшла");
    }

    console.log("\nТЕСТ EVENT:ACK ПРОЙДЕНО");
  } catch (error) {
    console.error("\nПОМИЛКА ТЕСТУ:", error.message);
    process.exitCode = 1;
  } finally {
    socket.disconnect();
  }
});

socket.on("connect_error", (error) => {
  console.error("Помилка підключення:", error.message);
  process.exitCode = 1;
});
