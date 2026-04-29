const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "task_assigned",
        "task_completed",
        "task_update",
        "new_message",
        "message",
        "project_joined",
        "project_created",
      ],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectChannel",
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    read: {
      type: Boolean,
      default: undefined,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

notificationSchema.pre("save", function syncReadFlags(next) {
  if (this.isModified("isRead")) {
    this.read = Boolean(this.isRead);
  } else if (this.isModified("read")) {
    this.isRead = Boolean(this.read);
  }

  next();
});

module.exports = mongoose.model("Notification", notificationSchema);
