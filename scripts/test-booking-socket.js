
import { io } from "socket.io-client";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Введи JWT access token: ", (token) => {
  if (!token.trim()) {
    console.log("Токен не може бути порожнім.");
    rl.close();
    process.exitCode = 1;
    return;
  }

  const socket = io("http://localhost:3000", {
    auth: { token: token.trim() },
    reconnection: false,
    timeout: 5000
  });

  socket.on("connect", () => {
    console.log("ПІДКЛЮЧЕННЯ УСПІШНЕ");
    console.log("Socket ID:", socket.id);

    rl.question("Введи ID ресурсу для тестування: ", (id) => {
      socket.emit(
        "room:join",
        { type: "resource", id: Number(id) },
        (response) => {
          console.log("Результат приєднання:", response);

          if (response.success) {
            console.log("ОЧІКУЄМО ПОДІЇ БРОНЮВАННЯ...");
          } else {
            console.log("Не вдалося приєднатися до кімнати.");
            socket.disconnect();
            rl.close();
          }
        }
      );
    });
  });

  socket.on("booking:created", (data) => {
    console.log("НОВЕ БРОНЮВАННЯ:", data);
  });

  socket.on("booking:updated", (data) => {
    console.log("БРОНЮВАННЯ ОНОВЛЕНО:", data);
  });

  socket.on("booking:cancelled", (data) => {
    console.log("БРОНЮВАННЯ СКАСОВАНО:", data);
  });

  socket.on("connect_error", (error) => {
    console.log("ПОМИЛКА ПІДКЛЮЧЕННЯ:", error.message);
    socket.disconnect();
    rl.close();
  });

  rl.on("close", () => {
    socket.disconnect();
  });
});
