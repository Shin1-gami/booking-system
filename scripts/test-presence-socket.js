
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
  });

  socket.on("presence:list", (data) => {
    console.log("\nСПИСОК КОРИСТУВАЧІВ ONLINE:");
    console.log(data.users);
  });

  socket.on("presence:online", (data) => {
    console.log("\nКОРИСТУВАЧ ONLINE:");
    console.log(data);
  });

  socket.on("presence:offline", (data) => {
    console.log("\nКОРИСТУВАЧ OFFLINE:");
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
