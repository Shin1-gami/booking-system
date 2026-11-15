import "dotenv/config";
import app from "./app.js";
import { prisma } from "./config/prisma.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();

    app.listen(PORT, () => {
      console.log(`Сервер запущено: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Помилка запуску сервера:", error);
    process.exit(1);
  }
}

startServer();