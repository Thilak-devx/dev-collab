const crypto = require("crypto");
const mongoose = require("mongoose");
const Invite = require("../models/Invite");
const Project = require("../models/Project");
const { emitProjectEvent, emitUserEvent } = require("../socket/socketServer");
const {
  serializeActivityPayload,
  serializeNotificationPayload,
  serializeProjectSummary,
  serializeUserSummary,
} = require("../socket/socketPayloads");
const { createActivity } = require("../utils/activityUtils");
const { createNotification } = require("../utils/notificationUtils");
const { getRequiredClientUrl } = require("../config/env");

const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000;

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

const hashInviteToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createRawInviteToken = () => crypto.randomBytes(32).toString("hex");

const buildInviteUrl = (token) => {
  const clientUrl = getRequiredClientUrl();
  return `${clientUrl.replace(/\/$/, "")}/invite/${token}`;
};

const populateProject = (projectId) =>
  Project.findById(projectId).populate("owner", "name email").populate("members", "name email");

const serializeInviteResponse = (invite, rawToken, project) => ({
  id: invite._id,
  inviteUrl: buildInviteUrl(rawToken),
  token: rawToken,
  expiresAt: invite.expiresAt,
  maxUses: invite.maxUses,
  usedCount: invite.usedCount,
  remainingUses: invite.maxUses ? Math.max(invite.maxUses - invite.usedCount, 0) : null,
  project: project
    ? {
      id: project._id,
      name: project.name,
      description: project.description,
    }
    : undefined,
});

const resolveInviteByRawToken = async (rawToken) => {
  const hashedToken = hashInviteToken(rawToken);
  return Invite.findOne({ token: hashedToken });
};

const validateInviteAvailability = async (invite) => {
  if (!invite) {
    return { status: 404, message: "Invite link is invalid" };
  }

  if (invite.hasExpired()) {
    await invite.deleteOne();
    return { status: 410, message: "Invite link has expired" };
  }

  if (invite.hasReachedUsageLimit()) {
    return { status: 409, message: "Invite link can no longer be used" };
  }

  return null;
};

const getInviteDetails = async (req, res) => {
  try {
    const rawToken = req.params.token?.trim();
    const invite = await resolveInviteByRawToken(rawToken);
    const availabilityError = await validateInviteAvailability(invite);

    if (availabilityError) {
      return res.status(availabilityError.status).json({ message: availabilityError.message });
    }

    const project = await Project.findById(invite.projectId).select("name description members");

    if (!project) {
      await invite.deleteOne();
      return res.status(404).json({ message: "Project not found for this invite" });
    }

    return res.status(200).json({
      invite: serializeInviteResponse(invite, rawToken, project),
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        memberCount: project.members.length,
      },
    });
  } catch (error) {
    console.error("Invite metadata error:", error.message);
    return res.status(500).json({ message: "Unable to load invite details" });
  }
};

const createInvite = async (req, res) => {
  try {
    const actorId = normalizeUserId(req.user?.id || req.user?._id);
    const { projectId, maxUses = null, expiresAt = null, regenerate = false } = req.body;

    if (!actorId || !mongoose.Types.ObjectId.isValid(actorId)) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.owner.toString() !== actorId) {
      return res.status(403).json({ message: "Only the project owner can generate invite links" });
    }

    if (regenerate) {
      await Invite.deleteMany({ projectId: project._id });
    }

    const rawToken = createRawInviteToken();
    const invite = await Invite.create({
      projectId: project._id,
      token: hashInviteToken(rawToken),
      expiresAt: expiresAt || new Date(Date.now() + DEFAULT_EXPIRY_MS),
      maxUses,
      createdBy: actorId,
    });

    await createActivity({
      type: regenerate ? "invite_link_regenerated" : "invite_link_created",
      userId: actorId,
      projectId: project._id,
      message: `${req.user.name || "A user"} ${regenerate ? "regenerated" : "created"} an invite link for ${project.name}`,
    });

    return res.status(regenerate ? 200 : 201).json({
      message: regenerate ? "Invite link regenerated successfully" : "Invite link created successfully",
      invite: serializeInviteResponse(invite, rawToken, project),
    });
  } catch (error) {
    console.error("Invite create error:", error.message);
    return res.status(500).json({ message: "Unable to create invite link" });
  }
};

const joinInvite = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);
    const rawToken = req.params.token?.trim();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    const invite = await resolveInviteByRawToken(rawToken);
    const availabilityError = await validateInviteAvailability(invite);

    if (availabilityError) {
      return res.status(availabilityError.status).json({ message: availabilityError.message });
    }

    const project = await Project.findById(invite.projectId);

    if (!project) {
      await invite.deleteOne();
      return res.status(404).json({ message: "Project not found for this invite" });
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((memberId) => memberId.toString() === userId);

    if (isOwner || isMember) {
      return res.status(409).json({ message: "You are already a member of this project" });
    }

    project.members.push(userId);
    invite.usedCount += 1;

    await Promise.all([project.save(), invite.save()]);

    const [activity, notification] = await Promise.all([
      createActivity({
        type: "member_joined",
        userId,
        projectId: project._id,
        message: `${req.user.name || "A user"} joined ${project.name} with an invite link`,
      }),
      createNotification({
        type: "project_joined",
        userId: project.owner,
        projectId: project._id,
        message: `${req.user.name || "A user"} joined project ${project.name} using an invite link.`,
      }),
    ]);

    const populatedProject = await populateProject(project._id);

    emitProjectEvent(project._id.toString(), "projectJoined", {
      projectId: project._id.toString(),
      project: serializeProjectSummary(populatedProject),
      joinedUser: serializeUserSummary(req.user),
      activity: serializeActivityPayload(activity, {
        actor: req.user,
        project,
      }),
    });

    emitUserEvent(project.owner.toString(), "notification", {
      notification: serializeNotificationPayload(notification),
      type: "projectJoined",
      project: serializeProjectSummary(populatedProject),
      actor: serializeUserSummary(req.user),
    });

    return res.status(200).json({
      message: "Project joined successfully",
      project: populatedProject,
      invite: {
        id: invite._id,
        usedCount: invite.usedCount,
        maxUses: invite.maxUses,
        remainingUses: invite.maxUses ? Math.max(invite.maxUses - invite.usedCount, 0) : null,
      },
    });
  } catch (error) {
    console.error("Invite join error:", error.message);
    return res.status(500).json({ message: "Unable to join project with invite" });
  }
};

module.exports = {
  createInvite,
  getInviteDetails,
  joinInvite,
};
