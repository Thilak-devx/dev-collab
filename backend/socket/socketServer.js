const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const User = require("../models/User");
const Project = require("../models/Project");
const ProjectChannel = require("../models/ProjectChannel");
const Message = require("../models/Message");
const {
  createNotificationsForUsers,
} = require("../utils/notificationUtils");
const {
  serializeChannelPayload,
  serializeMessagePayload,
  serializeNotificationPayload,
  serializeProjectSummary,
  serializeUserSummary,
} = require("./socketPayloads");
const { parseAllowedOrigins } = require("../config/env");

let ioInstance = null;
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

const parseCookieHeader = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((cookies, part) => {
    const trimmedPart = part.trim();

    if (!trimmedPart) {
      return cookies;
    }

    const separatorIndex = trimmedPart.indexOf("=");

    if (separatorIndex === -1) {
      return cookies;
    }

    const key = trimmedPart.slice(0, separatorIndex).trim();
    const value = decodeURIComponent(trimmedPart.slice(separatorIndex + 1).trim());

    if (key) {
      cookies[key] = value;
    }

    return cookies;
  }, {});

const sanitizeMessageContent = (value = "") =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .trim();

const getProjectRoom = (projectId) => `project:${projectId}`;
const getChannelRoom = (channelId) => `channel:${channelId}`;
const getUserRoom = (userId) => `user:${userId}`;

const resolveSocketToken = (socket) => {
  const cookies = parseCookieHeader(socket.handshake.headers?.cookie || "");
  const authHeader = socket.handshake.auth?.authorization || socket.handshake.headers?.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  return cookies.accessToken || socket.handshake.auth?.token || bearerToken || null;
};

const resolveChannelForUser = async (channelId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    return null;
  }

  const channel = await ProjectChannel.findById(channelId).select(
    "_id name slug projectId isDefault"
  );

  if (!channel) {
    return null;
  }

  const project = await ensureProjectMembership(channel.projectId.toString(), userId);

  if (!project) {
    return null;
  }

  return { channel, project };
};

const ensureProjectMembership = async (projectId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return null;
  }

  const project = await Project.findById(projectId).select("_id owner members");

  if (!project) {
    return null;
  }

  const isOwner = project.owner.toString() === userId;
  const isMember = project.members.some((memberId) => memberId.toString() === userId);

  return isOwner || isMember ? project : null;
};

const getDefaultProjectChannel = async (projectId, userId) => {
  let channel = await ProjectChannel.findOne({
    projectId,
    isDefault: true,
  }).select("_id name slug projectId isDefault");

  if (channel) {
    return channel;
  }

  channel = await ProjectChannel.create({
    projectId,
    name: "General",
    slug: "general",
    createdBy: userId,
    isDefault: true,
  });

  return channel;
};

const emitProjectEvent = (projectId, eventName, payload) => {
  if (!ioInstance || !projectId) {
    return;
  }

  ioInstance.to(getProjectRoom(projectId)).emit(eventName, payload);
};

const emitChannelEvent = (channelId, eventName, payload) => {
  if (!ioInstance || !channelId) {
    return;
  }

  ioInstance.to(getChannelRoom(channelId)).emit(eventName, payload);
};

const emitUserEvent = (userId, eventName, payload) => {
  if (!ioInstance || !userId) {
    return;
  }

  ioInstance.to(getUserRoom(userId)).emit(eventName, payload);
};

const createSocketServer = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: parseAllowedOrigins(),
      credentials: true,
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token = resolveSocketToken(socket);

      if (!token) {
        return next(new Error("Not authorized"));
      }

      if (!process.env.JWT_SECRET) {
        return next(new Error("JWT secret is not configured"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = normalizeUserId(decoded?.id || decoded?._id);

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return next(new Error("Invalid socket user"));
      }

      const user = await User.findById(userId).select("_id name email");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.data.user = user;
      return next();
    } catch (error) {
      return next(new Error("Not authorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const userId = normalizeUserId(socket.data.user?._id);

    if (userId) {
      socket.join(getUserRoom(userId));
    }

    socket.on("joinProjectRoom", async (projectId, callback = () => {}) => {
      try {
        const project = await ensureProjectMembership(projectId, userId);

        if (!project) {
          callback({ ok: false, message: "Project access denied" });
          return;
        }

        socket.join(getProjectRoom(project._id.toString()));
        callback({ ok: true, room: getProjectRoom(project._id.toString()) });
      } catch (error) {
        callback({ ok: false, message: "Unable to join project room" });
      }
    });

    socket.on("join_project", async (projectId, callback = () => {}) => {
      try {
        const project = await ensureProjectMembership(projectId, userId);

        if (!project) {
          callback({ ok: false, message: "Project access denied" });
          return;
        }

        socket.join(getProjectRoom(project._id.toString()));
        callback({ ok: true, room: getProjectRoom(project._id.toString()) });
      } catch (error) {
        callback({ ok: false, message: "Unable to join project room" });
      }
    });

    socket.on("leaveProjectRoom", (projectId, callback = () => {}) => {
      if (!projectId) {
        callback({ ok: false, message: "Project ID is required" });
        return;
      }

      socket.leave(getProjectRoom(projectId));
      callback({ ok: true });
    });

    socket.on("send_message", async (payload, callback = () => {}) => {
      try {
        if (payload?._id && payload?.channelId) {
          const persistedChannelId =
            payload.channelId?._id || payload.channelId?.id || payload.channelId;
          const result = await resolveChannelForUser(persistedChannelId, userId);

          if (!result) {
            callback({ ok: false, message: "Channel access denied" });
            return;
          }

          const realtimePayload = {
            message: payload,
            project: serializeProjectSummary(result.project),
            sender: serializeUserSummary(socket.data.user),
            channel: serializeChannelPayload(result.channel),
          };

          ioInstance.to(getChannelRoom(result.channel._id.toString())).emit("receive_message", realtimePayload);
          ioInstance.to(getChannelRoom(result.channel._id.toString())).emit("messageCreated", realtimePayload);
          ioInstance.to(getProjectRoom(result.project._id.toString())).emit("messageCreated", realtimePayload);

          callback({
            ok: true,
            message: realtimePayload.message,
            channel: realtimePayload.channel,
            project: realtimePayload.project,
          });
          return;
        }

        const projectId = payload?.projectId;
        const channelId = payload?.channelId;
        const content = sanitizeMessageContent(payload?.content || payload?.body || "");

        if (!content) {
          callback({ ok: false, message: "Message content is required" });
          return;
        }

        if (content.length > maxMessageLength) {
          callback({ ok: false, message: "Message is too long" });
          return;
        }

        let project = null;
        let targetChannel = null;

        if (channelId) {
          const result = await resolveChannelForUser(channelId, userId);

          if (!result) {
            callback({ ok: false, message: "Channel access denied" });
            return;
          }

          project = result.project;
          targetChannel = result.channel;
        } else {
          if (!projectId) {
            callback({ ok: false, message: "Project or channel is required" });
            return;
          }

          project = await ensureProjectMembership(projectId, userId);

          if (!project) {
            callback({ ok: false, message: "Project access denied" });
            return;
          }

          targetChannel = await getDefaultProjectChannel(project._id, userId);
        }

        const message = await Message.create({
          projectId: project._id,
          channelId: targetChannel._id,
          senderId: userId,
          content,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate("senderId", "name email")
          .populate("channelId", "name slug")
          .populate("projectId", "name");

        const recipientIds = [
          project.owner?.toString(),
          ...(project.members || []).map((memberId) => memberId.toString()),
        ].filter((recipientId) => recipientId && recipientId !== userId);

        const notifications = await createNotificationsForUsers({
          type: "new_message",
          userIds: recipientIds,
          projectId: project._id,
          message: `${socket.data.user.name || "A teammate"} sent a new project message.`,
        });

        const realtimePayload = {
          message: serializeMessagePayload(populatedMessage),
          project: serializeProjectSummary(project),
          sender: serializeUserSummary(socket.data.user),
          channel: serializeChannelPayload(targetChannel),
        };

        ioInstance.to(getChannelRoom(targetChannel._id.toString())).emit("receive_message", realtimePayload);
        ioInstance.to(getChannelRoom(targetChannel._id.toString())).emit("messageCreated", realtimePayload);
        ioInstance.to(getProjectRoom(project._id.toString())).emit("messageCreated", realtimePayload);

        notifications.forEach((notification) => {
          emitUserEvent(notification.userId.toString(), "notification", {
            notification: serializeNotificationPayload(notification),
            type: "newMessage",
            message: serializeMessagePayload(populatedMessage),
            project: serializeProjectSummary(project),
            actor: serializeUserSummary(socket.data.user),
          });
        });

        callback({
          ok: true,
          message: realtimePayload.message,
          channel: realtimePayload.channel,
          project: realtimePayload.project,
        });
      } catch (error) {
        console.error("Socket send_message error:", error.message);
        callback({ ok: false, message: "Unable to send message" });
      }
    });

    socket.on("joinChannelRoom", async (payload, callback = () => {}) => {
      try {
        const projectId = payload?.projectId;
        const channelId = payload?.channelId;
        const project = await ensureProjectMembership(projectId, userId);

        if (!project) {
          callback({ ok: false, message: "Project access denied" });
          return;
        }

        const channel = await ProjectChannel.findOne({
          _id: channelId,
          projectId: project._id,
        }).select("_id");

        if (!channel) {
          callback({ ok: false, message: "Channel not found" });
          return;
        }

        socket.join(getProjectRoom(project._id.toString()));
        socket.join(getChannelRoom(channel._id.toString()));
        callback({ ok: true, room: getChannelRoom(channel._id.toString()) });
      } catch (error) {
        callback({ ok: false, message: "Unable to join channel room" });
      }
    });

    socket.on("join_channel", async (channelId, callback = () => {}) => {
      try {
        const result = await resolveChannelForUser(channelId, userId);

        if (!result) {
          callback({ ok: false, message: "Channel access denied" });
          return;
        }

        socket.join(getProjectRoom(result.project._id.toString()));
        socket.join(getChannelRoom(result.channel._id.toString()));
        callback({ ok: true, room: getChannelRoom(result.channel._id.toString()) });
      } catch (error) {
        callback({ ok: false, message: "Unable to join channel room" });
      }
    });

    socket.on("leaveChannelRoom", (channelId, callback = () => {}) => {
      if (!channelId) {
        callback({ ok: false, message: "Channel ID is required" });
        return;
      }

      socket.leave(getChannelRoom(channelId));
      callback({ ok: true });
    });
  });

  return ioInstance;
};

const getSocketServer = () => ioInstance;

module.exports = {
  createSocketServer,
  emitProjectEvent,
  emitChannelEvent,
  getChannelRoom,
  emitUserEvent,
  getProjectRoom,
  getSocketServer,
  getUserRoom,
};
