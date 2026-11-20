import { io } from "socket.io-client";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Введи JWT access token користувача: ", (token) => {
  if (!token.trim()) {
    console.log("Токен не може бути порожнім.");
    rl.close();
    process.exitCode = 1;
    return;
  }

  const socket = io("http://localhost:3000", {
    auth: {
      token: token.trim()
    },
    reconnection: false,
    timeout: 5000
  });

  socket.on("connect", () => {
    console.log("ПІДКЛЮЧЕННЯ УСПІШНЕ");
    console.log("Socket ID:", socket.id);
    console.log("Очікуємо сповіщення...");
  });

  socket.on("notification:new", (data) => {
    console.log("\nНОВЕ СПОВІЩЕННЯ:");
    console.log(data);
  });

  socket.on("notification:updated", (data) => {
    console.log("\nСПОВІЩЕННЯ ОНОВЛЕНО:");
    console.log(data);
  });

  socket.on("notification:deleted", (data) => {
    console.log("\nСПОВІЩЕННЯ ВИДАЛЕНО:");
    console.log(data);
  });

  socket.on("connect_error", (error) => {
    console.log("ПОМИЛКА ПІДКЛЮЧЕННЯ:", error.message);
    rl.close();
  });

  rl.on("close", () => {
    socket.disconnect();
  });
});