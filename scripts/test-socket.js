
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {},
  reconnection: false,
  timeout: 5000
});

socket.on("connect", () => {
  console.error("ПОМИЛКА: неавторизоване підключення було дозволено");
  socket.disconnect();
  process.exitCode = 1;
});

socket.on("connect_error", (error) => {
  console.log("Підключення без токена відхилено.");
  console.log("Повідомлення сервера:", error.message);

  if (error.message.includes("авторизуватися")) {
    console.log("ТЕСТ ПРОЙДЕНО");
  } else {
    console.error("Отримано неочікувану помилку");
    process.exitCode = 1;
  }

  socket.disconnect();
});
