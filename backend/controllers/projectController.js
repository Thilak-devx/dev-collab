const mongoose = require("mongoose");
const crypto = require("crypto");
const Project = require("../models/Project");
const User = require("../models/User");
const Task = require("../models/Task");
const TaskFile = require("../models/TaskFile");
const Invite = require("../models/Invite");
const Message = require("../models/Message");
const ProjectChannel = require("../models/ProjectChannel");
const { ensureDefaultProjectChannel } = require("../utils/channelUtils");
const { createActivity } = require("../utils/activityUtils");
const { createNotification } = require("../utils/notificationUtils");
const { normalizeUserId, serializeProject } = require("../utils/projectUtils");
const { getRequiredClientUrl } = require("../config/env");

const INVITE_EXPIRY_MS = 24 * 60 * 60 * 1000;

const populateProject = (projectId) =>
  Project.findById(projectId)
    .populate("owner", "name email")
    .populate("members", "name email")
    .populate("admins", "name email");

const buildInviteUrl = (token) => {
  const clientUrl = getRequiredClientUrl();
  return `${clientUrl.replace(/\/$/, "")}/invite/${token}`;
};

const generateUniqueInviteToken = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = crypto.randomBytes(32).toString("hex");
    const existingInvite = await Invite.findOne({ token }).select("_id");

    if (!existingInvite) {
      return token;
    }
  }

  throw new Error("Unable to generate a unique invite token");
};

const createProject = async (req, res) => {
  try {
    const { name, description, members = [], admins = [] } = req.body;
    const userId = normalizeUserId(req.user?.id || req.user?._id);

    if (!name || !description) {
      return res.status(400).json({ message: "Project name and description are required" });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    const owner = await User.findById(userId).select("_id");

    if (!owner) {
      console.error("Project owner not found:", { userId });
      return res.status(404).json({ message: "Authenticated user not found" });
    }

    const invalidMemberId = [...members, ...admins].find((memberId) => !mongoose.Types.ObjectId.isValid(memberId));
    if (invalidMemberId) {
      return res.status(400).json({ message: `Invalid user ID: ${invalidMemberId}` });
    }

    const uniqueMembers = [...new Set([userId, ...members, ...admins])];
    const uniqueAdmins = [...new Set(admins.filter((adminId) => adminId !== userId))];
    const existingUsers = await User.find({
      _id: mongoose.trusted({ $in: uniqueMembers }),
    }).select("_id");

    if (existingUsers.length !== uniqueMembers.length) {
      return res.status(404).json({ message: "One or more project members were not found" });
    }

    const project = await Project.create({
      name,
      description,
      owner: owner._id,
      members: uniqueMembers,
      admins: uniqueAdmins,
    });

    await ensureDefaultProjectChannel(project._id, owner._id);

    await Promise.all([
      createActivity({
        type: "project_created",
        userId,
        projectId: project._id,
        message: `${req.user.name || "A user"} created project ${project.name}`,
      }),
      createNotification({
        type: "project_created",
        userId,
        projectId: project._id,
        message: `Project ${project.name} was created successfully.`,
      }),
    ]);

    const populatedProject = await populateProject(project._id);

    return res.status(201).json({
      message: "Project created successfully",
      project: serializeProject(populatedProject, userId),
    });
  } catch (error) {
    console.error("Project create error:", error.message);

    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];
      return res.status(400).json({ message: firstError?.message || "Invalid project data" });
    }

    return res.status(500).json({ message: "Unable to create project" });
  }
};

const inviteProjectMember = async (req, res) => {
  try {
    const actorId = normalizeUserId(req.user?.id || req.user?._id);
    const email = req.body.email?.trim().toLowerCase();
    const role = req.body.role || "member";

    if (!actorId) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    if (!email) {
      const token = await generateUniqueInviteToken();
      const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

      const invite = await Invite.create({
        projectId: req.project._id,
        token,
        expiresAt,
        createdBy: actorId,
      });

      await createActivity({
        type: "invite_link_created",
        userId: actorId,
        projectId: req.project._id,
        message: `${req.user.name || "A user"} created an invite link for ${req.project.name}`,
      });

      return res.status(201).json({
        message: "Invite link created successfully",
        inviteUrl: buildInviteUrl(invite.token),
        token: invite.token,
        expiresAt: invite.expiresAt,
      });
    }

    const user = await User.findOne({ email }).select("_id name email");

    if (!user) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    const alreadyMember = req.project.owner.toString() === user._id.toString()
      || req.project.members.some((memberId) => memberId.toString() === user._id.toString());

    if (alreadyMember) {
      return res.status(409).json({ message: "User is already part of this project" });
    }

    req.project.members.push(user._id);
    if (role === "admin") {
      req.project.admins = [...new Set([...(req.project.admins || []).map(String), user._id.toString()])];
    }
    await req.project.save();

    await Promise.all([
      createActivity({
        type: "member_invited",
        userId: actorId,
        projectId: req.project._id,
        message: `${req.user.name || "A user"} invited ${user.name} to ${req.project.name} as ${role}`,
      }),
      createNotification({
        type: "project_joined",
        userId: user._id,
        projectId: req.project._id,
        message: `You were added to project ${req.project.name}.`,
      }),
    ]);

    const updatedProject = await populateProject(req.project._id);

    return res.status(200).json({
      message: "Member invited successfully",
      project: serializeProject(updatedProject, actorId),
    });
  } catch (error) {
    console.error("Project invite error:", error.message);
    return res.status(500).json({ message: "Unable to invite member" });
  }
};

const getProjects = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);

    if (!userId) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    const projects = await Project
      .find({
        $or: [{ owner: userId }, { members: userId }],
      })
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(projects.map((project) => serializeProject(project, userId)));
  } catch (error) {
    console.error("Project fetch error:", error.message);
    return res.status(500).json({ message: "Unable to fetch projects" });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project
      .findById(req.project._id)
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(200).json(serializeProject(project, normalizeUserId(req.user?.id || req.user?._id)));
  } catch (error) {
    console.error("Project detail error:", error.message);
    return res.status(500).json({ message: "Unable to fetch project" });
  }
};

const addProjectMembers = async (req, res) => {
  try {
    const { members, admins = [] } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "Members must be a non-empty array of user IDs" });
    }

    const invalidMemberId = [...members, ...admins].find((memberId) => !mongoose.Types.ObjectId.isValid(memberId));
    if (invalidMemberId) {
      return res.status(400).json({ message: `Invalid user ID: ${invalidMemberId}` });
    }

    const uniqueMembers = [...new Set([...req.project.members.map(String), ...members, ...admins, req.project.owner.toString()])];
    const uniqueAdmins = [...new Set(admins.filter((adminId) => adminId !== req.project.owner.toString()))];
    const existingUsers = await User.find({
      _id: mongoose.trusted({ $in: uniqueMembers }),
    }).select("_id");

    if (existingUsers.length !== uniqueMembers.length) {
      return res.status(404).json({ message: "One or more project members were not found" });
    }

    req.project.members = uniqueMembers;
    req.project.admins = uniqueAdmins;
    await req.project.save();

    const updatedProject = await populateProject(req.project._id);

    return res.status(200).json(serializeProject(updatedProject, normalizeUserId(req.user?.id || req.user?._id)));
  } catch (error) {
    console.error("Project member update error:", error.message);
    return res.status(500).json({ message: "Unable to update project members" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const projectTasks = await Task.find({ projectId: req.project._id }).select("_id");
    const projectTaskIds = projectTasks.map((task) => task._id);

    if (projectTaskIds.length) {
      await TaskFile.deleteMany({
        taskId: mongoose.trusted({ $in: projectTaskIds }),
      });
    }

    await Task.deleteMany({ projectId: req.project._id });
    await Message.deleteMany({ projectId: req.project._id });
    await ProjectChannel.deleteMany({ projectId: req.project._id });
    await Invite.deleteMany({ projectId: req.project._id });
    await req.project.deleteOne();

    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Project delete error:", error.message);
    return res.status(500).json({ message: "Unable to delete project" });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  addProjectMembers,
  inviteProjectMember,
  deleteProject,
};
