const Notification = require("../models/Notification");

const createNotification = async ({
  type,
  userId,
  message,
  projectId = null,
  taskId = null,
  conversationId = null,
}) => {
  if (!type || !userId || !message) {
    return null;
  }

  return Notification.create({
    type,
    userId,
    message,
    projectId,
    taskId,
    conversationId,
  });
};

const createNotificationsForUsers = async ({
  type,
  userIds = [],
  message,
  projectId = null,
  taskId = null,
  conversationId = null,
}) => {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map(String))];

  if (!type || !message || !uniqueUserIds.length) {
    return [];
  }

  const documents = uniqueUserIds.map((userId) => ({
    type,
    userId,
      message,
      projectId,
      taskId,
      conversationId,
    }));

  return Notification.insertMany(documents);
};

module.exports = {
  createNotification,
  createNotificationsForUsers,
};
