const mongoose = require("mongoose");
const Project = require("../models/Project");
const {
  hasProjectAccess,
  hasProjectManagerAccess,
  normalizeUserId,
} = require("../utils/projectUtils");

const loadProject = async (req, res, next) => {
  const projectId = req.params.id || req.params.projectId;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  req.project = project;
  return next();
};

const requireProjectMember = (req, res, next) => {
  const userId = normalizeUserId(req.user?.id || req.user?._id);

  if (!userId) {
    return res.status(401).json({ message: "Authenticated user is invalid" });
  }

  if (!hasProjectAccess(req.project, userId)) {
    return res.status(403).json({ message: "Only project members can access this project" });
  }

  return next();
};

const requireProjectOwner = (req, res, next) => {
  const userId = normalizeUserId(req.user?.id || req.user?._id);

  if (!userId) {
    return res.status(401).json({ message: "Authenticated user is invalid" });
  }

  if (req.project.owner.toString() !== userId) {
    return res.status(403).json({ message: "Only the project owner can perform this action" });
  }

  return next();
};

const requireProjectManager = (req, res, next) => {
  const userId = normalizeUserId(req.user?.id || req.user?._id);

  if (!userId) {
    return res.status(401).json({ message: "Authenticated user is invalid" });
  }

  if (!hasProjectManagerAccess(req.project, userId)) {
    return res.status(403).json({ message: "Only project owners or admins can perform this action" });
  }

  return next();
};

module.exports = {
  loadProject,
  requireProjectMember,
  requireProjectOwner,
  requireProjectManager,
};
