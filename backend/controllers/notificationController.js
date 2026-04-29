const Notification = require("../models/Notification");
const { emitUserEvent } = require("../socket/socketServer");

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

const serializeNotificationForClient = (notification) => ({
  ...notification.toObject ? notification.toObject() : notification,
  isRead: typeof notification.isRead === "boolean" ? notification.isRead : Boolean(notification.read),
  read: typeof notification.isRead === "boolean" ? notification.isRead : Boolean(notification.read),
});

const getNotifications = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    if (!userId) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    const notifications = await Notification.find({ userId })
      .populate("projectId", "name")
      .populate("taskId", "title")
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json(notifications.map(serializeNotificationForClient));
  } catch (error) {
    console.error("Notification fetch error:", error.message);
    return res.status(500).json({ message: "Unable to fetch notifications" });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    notification.read = true;
    await notification.save();

    return res.status(200).json(serializeNotificationForClient(notification));
  } catch (error) {
    console.error("Notification update error:", error.message);
    return res.status(500).json({ message: "Unable to update notification" });
  }
};

const toggleNotificationRead = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = Boolean(req.body?.read);
    await notification.save();

    return res.status(200).json(serializeNotificationForClient(notification));
  } catch (error) {
    console.error("Notification toggle error:", error.message);
    return res.status(500).json({ message: "Unable to update notification" });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);

    if (!userId) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    const unreadNotifications = await Notification.find({
      userId,
      isRead: false,
    }).select("_id");

    const notificationIds = unreadNotifications.map((notification) => notification._id.toString());

    await Notification.updateMany(
      {
        userId,
        isRead: false,
      },
      { $set: { isRead: true, read: true } }
    );

    emitUserEvent(userId, "notifications_read", {
      notificationIds,
      isRead: true,
    });

    return res.status(200).json({
      message: "Notifications marked as read",
      notificationIds,
    });
  } catch (error) {
    console.error("Notification bulk update error:", error.message);
    return res.status(500).json({ message: "Unable to update notifications" });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  toggleNotificationRead,
  markAllNotificationsRead,
};
