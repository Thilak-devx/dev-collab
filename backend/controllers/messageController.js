const mongoose = require("mongoose");
const Message = require("../models/Message");
const ProjectChannel = require("../models/ProjectChannel");
const Project = require("../models/Project");
const {
  emitChannelEvent,
  emitProjectEvent,
  emitUserEvent,
} = require("../socket/socketServer");
const {
  serializeChannelPayload,
  serializeMessagePayload,
  serializeNotificationPayload,
  serializeProjectSummary,
  serializeUserSummary,
} = require("../socket/socketPayloads");
const {
  ensureDefaultProjectChannel,
  ensureUniqueChannelSlug,
} = require("../utils/channelUtils");
const {
  createNotificationsForUsers,
} = require("../utils/notificationUtils");
const maxMessageLength = 1000;

const normalizeUserId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  const normalizedValue = value.toString?.();

  if (!normalizedValue || normalizedValue === "[object Object]") {
    return null;
  }

  return normalizedValue;
};

const sanitizeMessageContent = (value) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .trim();

const populateMessage = (query) =>
  query
    .populate("senderId", "name email")
    .populate("channelId", "name slug")
    .populate("projectId", "name");

const getDefaultChannelForProject = async (projectId, userId) => {
  await ensureDefaultProjectChannel(projectId, userId);

  return ProjectChannel.findOne({
    projectId,
    isDefault: true,
  });
};

const resolveChannelForProject = async (projectId, channelId) => {
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    return null;
  }

  return ProjectChannel.findOne({
    _id: channelId,
    projectId,
  });
};

const resolveChannelWithProjectAccess = async (channelId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    return { error: "Invalid channel ID", status: 400 };
  }

  const channel = await ProjectChannel.findById(channelId);

  if (!channel) {
    return { error: "Channel not found", status: 404 };
  }

  const project = await Project.findById(channel.projectId).select(
    "_id name owner members"
  );

  if (!project) {
    return { error: "Project not found", status: 404 };
  }

  const isOwner = project.owner.toString() === userId;
  const isMember = project.members.some((memberId) => memberId.toString() === userId);

  if (!isOwner && !isMember) {
    return { error: "Only project members can access this channel", status: 403 };
  }

  return { channel, project };
};

const listProjectChannels = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);
    await ensureDefaultProjectChannel(req.project._id, userId);

    const channels = await ProjectChannel.find({
      projectId: req.project._id,
    }).sort({ isDefault: -1, createdAt: 1 });

    return res.status(200).json(channels);
  } catch (error) {
    console.error("Channel list error:", error.message);
    return res.status(500).json({ message: "Unable to fetch project channels" });
  }
};

const createProjectChannel = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);
    const { name, projectId } = req.body;
    const resolvedProjectId = req.project?._id?.toString() || projectId;

    if (!name?.trim() || !resolvedProjectId) {
      return res.status(400).json({ message: "Name and projectId required" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    if (projectId && req.project?._id && projectId !== req.project._id.toString()) {
      return res.status(400).json({ message: "Project context does not match request payload" });
    }

    const slug = await ensureUniqueChannelSlug(req.project._id, name.trim());

    const channel = await ProjectChannel.create({
      projectId: resolvedProjectId,
      name: name.trim(),
      slug,
      createdBy: userId,
    });

    emitProjectEvent(req.project._id.toString(), "channelCreated", {
      channel: serializeChannelPayload(channel),
      project: serializeProjectSummary(req.project),
      actor: serializeUserSummary(req.user),
    });

    return res.status(201).json(channel);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Channel creation failed" });
  }
};

const deleteProjectChannel = async (req, res) => {
  try {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: "Invalid channel ID" });
    }

    const channel = await ProjectChannel.findOne({
      _id: channelId,
      projectId: req.project._id,
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.isDefault) {
      return res.status(400).json({ message: "The default channel cannot be deleted" });
    }

    await Message.deleteMany({
      projectId: req.project._id,
      channelId: channel._id,
    });

    await channel.deleteOne();

    emitProjectEvent(req.project._id.toString(), "channelDeleted", {
      channelId: channel._id.toString(),
      project: serializeProjectSummary(req.project),
      actor: serializeUserSummary(req.user),
    });

    return res.status(200).json({
      message: "Channel deleted successfully",
      channelId: channel._id.toString(),
    });
  } catch (error) {
    console.error("Channel delete error:", error.message);
    return res.status(500).json({ message: "Unable to delete channel" });
  }
};

const getChannelMessages = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    await ensureDefaultProjectChannel(req.project._id, normalizeUserId(req.user?.id || req.user?._id));

    const channel = await resolveChannelForProject(req.project._id, req.params.channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const messages = await populateMessage(
      Message.find({
        projectId: req.project._id,
        channelId: channel._id,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
    );

    return res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("Message list error:", error.message);
    return res.status(500).json({ message: "Unable to fetch messages" });
  }
};

const getProjectMessages = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);
    const defaultChannel = await getDefaultChannelForProject(req.project._id, userId);

    if (!defaultChannel) {
      return res.status(404).json({ message: "Project chat channel not found" });
    }

    const messages = await populateMessage(
      Message.find({
        projectId: req.project._id,
        channelId: defaultChannel._id,
      }).sort({ createdAt: 1 })
    );

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Project message list error:", error.message);
    return res.status(500).json({ message: "Unable to fetch project messages" });
  }
};

const getMessagesByChannel = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);
    const { channel, project, error, status } = await resolveChannelWithProjectAccess(
      req.params.channelId,
      userId
    );

    if (error) {
      return res.status(status).json({ message: error });
    }

    const messages = await populateMessage(
      Message.find({
        projectId: project._id,
        channelId: channel._id,
      }).sort({ createdAt: 1 })
    );

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Channel message list error:", error.message);
    return res.status(500).json({ message: "Unable to fetch messages" });
  }
};

const createChannelMessage = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);

    if (!userId) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    const channel = await resolveChannelForProject(req.project._id, req.params.channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const content = sanitizeMessageContent(req.body.body || req.body.content || "");

    if (!content) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (content.length > maxMessageLength) {
      return res.status(400).json({ message: "Message is too long" });
    }

    const message = await Message.create({
      projectId: req.project._id,
      channelId: channel._id,
      senderId: userId,
      content,
    });

    const populatedMessage = await populateMessage(Message.findById(message._id));

    const recipientIds = [
      req.project.owner?.toString(),
      ...(req.project.members || []).map((memberId) => memberId.toString()),
    ].filter((recipientId) => recipientId && recipientId !== userId);

    const notifications = await createNotificationsForUsers({
      type: "message",
      userIds: recipientIds,
      projectId: req.project._id,
      conversationId: channel._id,
      message: `${req.user.name || "A teammate"} sent a new message in #${channel.slug}.`,
    });

    emitChannelEvent(channel._id.toString(), "messageCreated", {
      message: serializeMessagePayload(populatedMessage),
      channel: serializeChannelPayload(channel),
      project: serializeProjectSummary(req.project),
    });

    notifications.forEach((notification) => {
      emitUserEvent(notification.userId.toString(), "notification", {
        notification: serializeNotificationPayload(notification),
        type: "newMessage",
        message: serializeMessagePayload(populatedMessage),
        channel: serializeChannelPayload(channel),
        project: serializeProjectSummary(req.project),
        actor: serializeUserSummary(req.user),
      });
    });

    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Message create error:", error.message);
    return res.status(500).json({ message: "Unable to send message" });
  }
};

const createMessage = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);
    const { channelId } = req.body;
    const { channel, project, error, status } = await resolveChannelWithProjectAccess(
      channelId,
      userId
    );

    if (error) {
      return res.status(status).json({ message: error });
    }

    const content = sanitizeMessageContent(req.body.content || "");

    if (!content) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (content.length > maxMessageLength) {
      return res.status(400).json({ message: "Message is too long" });
    }

    const message = await Message.create({
      projectId: project._id,
      channelId: channel._id,
      senderId: userId,
      content,
    });

    const populatedMessage = await populateMessage(Message.findById(message._id));

    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Message create error:", error.message);
    return res.status(500).json({ message: "Unable to save message" });
  }
};

module.exports = {
  listProjectChannels,
  createChannel: createProjectChannel,
  createProjectChannel,
  deleteProjectChannel,
  createMessage,
  getProjectMessages,
  getMessagesByChannel,
  getChannelMessages,
  createChannelMessage,
};
