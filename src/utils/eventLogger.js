
import { prisma } from "../config/prisma.js";

// Збереження події в PostgreSQL та її передавання через Socket.IO
export async function publishUserEvent(
  io,
  userId,
  event,
  payload,
  rooms = []
) {
  // Перетворюємо дані на формат JSON
  const normalizedPayload = JSON.parse(
    JSON.stringify(payload)
  );

  // Зберігаємо подію в базі даних
  const savedEvent = await prisma.userEvent.create({
    data: {
      userId,
      event,
      payload: normalizedPayload
    }
  });

  // Додаємо ID події до даних
  const eventData = {
    ...normalizedPayload,
    eventId: savedEvent.id
  };

  // Передаємо подію через Socket.IO
  if (io) {
    let target = io.to(`user:${userId}`);

    // Додаємо додаткові кімнати
    for (const room of rooms) {
      target = target.to(room);
    }

    target.emit(event, eventData);
  }

  return savedEvent;
}
