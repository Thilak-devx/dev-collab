const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectChannel",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

messageSchema.index({ channelId: 1, createdAt: 1 });
messageSchema.index({ projectId: 1, createdAt: -1 });

messageSchema.virtual("body")
  .get(function getBody() {
    return this.content;
  })
  .set(function setBody(value) {
    this.content = value;
  });

messageSchema.virtual("sender")
  .get(function getSender() {
    return this.senderId;
  })
  .set(function setSender(value) {
    this.senderId = value;
  });

module.exports = mongoose.model("Message", messageSchema);
