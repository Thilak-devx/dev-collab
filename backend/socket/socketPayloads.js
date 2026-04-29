const serializeUserSummary = (user) => {
  if (!user) {
    return null;
  }

  return {
    _id: user._id || user.id,
    id: user.id || user._id,
    name: user.name,
    email: user.email,
  };
};

const serializeProjectSummary = (project) => {
  if (!project) {
    return null;
  }

  return {
    _id: project._id || project.id,
    id: project.id || project._id,
    name: project.name,
    description: project.description,
    owner: project.owner,
    members: project.members,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
};

const serializeActivityPayload = (activity, { actor = null, project = null } = {}) => {
  if (!activity) {
    return null;
  }

  return {
    _id: activity._id || activity.id,
    id: activity.id || activity._id,
    type: activity.type,
    message: activity.message,
    timestamp: activity.timestamp || activity.createdAt,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
    userId: actor ? serializeUserSummary(actor) : activity.userId,
    projectId: project
      ? {
        _id: project._id || project.id,
        id: project.id || project._id,
        name: project.name,
      }
      : activity.projectId,
  };
};

const serializeNotificationPayload = (notification) => {
  if (!notification) {
    return null;
  }

  return {
    _id: notification._id || notification.id,
    id: notification.id || notification._id,
    type: notification.type,
    userId: notification.userId,
    projectId: notification.projectId,
    taskId: notification.taskId,
    conversationId: notification.conversationId,
    message: notification.message,
    isRead:
      typeof notification.isRead === "boolean"
        ? notification.isRead
        : Boolean(notification.read),
    read:
      typeof notification.isRead === "boolean"
        ? notification.isRead
        : Boolean(notification.read),
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
};

const serializeChannelPayload = (channel) => {
  if (!channel) {
    return null;
  }

  return {
    _id: channel._id || channel.id,
    id: channel.id || channel._id,
    projectId: channel.projectId,
    name: channel.name,
    slug: channel.slug,
    isDefault: Boolean(channel.isDefault),
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt,
  };
};

const serializeMessagePayload = (message) => {
  if (!message) {
    return null;
  }

  return {
    _id: message._id || message.id,
    id: message.id || message._id,
    projectId: message.projectId,
    channelId: message.channelId,
    content: message.content || message.body,
    body: message.body,
    senderId: message.senderId,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};

module.exports = {
  serializeActivityPayload,
  serializeChannelPayload,
  serializeMessagePayload,
  serializeNotificationPayload,
  serializeProjectSummary,
  serializeUserSummary,
};
