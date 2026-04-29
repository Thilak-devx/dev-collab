const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");

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

const loadTaskProject = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  const task = await Task.findById(id);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const project = await Project.findById(task.projectId);

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const userId = normalizeUserId(req.user?.id || req.user?._id);

  if (!userId) {
    return res.status(401).json({ message: "Authenticated user is invalid" });
  }

  const isOwner = project.owner.toString() === userId;
  const isMember = project.members.some(
    (member) => member.toString() === userId
  );

  if (!isOwner && !isMember) {
    return res.status(403).json({ message: "Only project members can access this task" });
  }

  req.task = task;
  req.project = project;
  return next();
};

module.exports = { loadTaskProject };
