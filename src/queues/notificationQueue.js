
import { Queue } from "bullmq";
import { queueRedisConnection } from "../config/queueRedis.js";

// Відповідність пріоритетів BullMQ
export const NOTIFICATION_PRIORITIES = {
  URGENT: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4
};

// Черга фонової обробки сповіщень
export const notificationQueue = new Queue(
  "notifications",
  {
    connection: queueRedisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 2000
      },
      removeOnComplete: {
        age: 86400,
        count: 1000
      },
      removeOnFail: {
        age: 604800
      }
    }
  }
);

// Додавання одного сповіщення
export async function enqueueNotification(notification) {
  const priority =
    NOTIFICATION_PRIORITIES[notification.priority] ??
    NOTIFICATION_PRIORITIES.NORMAL;

  return notificationQueue.add(
    "deliver-notification",
    {
      notificationId: notification.id
    },
    {
      priority,
      jobId: `notification-${notification.id}`
    }
  );
}

// Пакетне додавання сповіщень
export async function enqueueNotifications(notifications) {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  const jobs = notifications.map((notification) => ({
    name: "deliver-notification",
    data: {
      notificationId: notification.id
    },
    opts: {
      priority:
        NOTIFICATION_PRIORITIES[notification.priority] ??
        NOTIFICATION_PRIORITIES.NORMAL,
      jobId: `notification-${notification.id}`
    }
  }));

  return notificationQueue.addBulk(jobs);
}
