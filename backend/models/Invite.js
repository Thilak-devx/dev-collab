const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    maxUses: {
      type: Number,
      default: null,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

inviteSchema.methods.hasExpired = function hasExpired() {
  return Boolean(this.expiresAt && this.expiresAt.getTime() <= Date.now());
};

inviteSchema.methods.hasReachedUsageLimit = function hasReachedUsageLimit() {
  return Boolean(this.maxUses && this.usedCount >= this.maxUses);
};

module.exports = mongoose.model("Invite", inviteSchema);
