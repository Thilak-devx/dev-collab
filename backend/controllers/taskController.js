const mongoose = require("mongoose");
const Task = require("../models/Task");
const TaskFile = require("../models/TaskFile");
const User = require("../models/User");
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

const validStatuses = ["todo", "in_progress", "done"];
const validPriorities = ["low", "medium", "high", "urgent"];
const maxTaskFileSize = 5 * 1024 * 1024;
const validTaskFileTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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

const normalizeTaskStatus = (status) => {
  if (!status) {
    return null;
  }

  return status === "in-progress" ? "in_progress" : status;
};

const populateTask = (query) =>
  query
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("projectId", "name description owner members");

const populateTaskFiles = (query) => query.populate("uploadedBy", "name email");

const ensureAssigneeBelongsToProject = async (assignedTo, project) => {
  if (!assignedTo) {
    return { assigneeId: null };
  }

  if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
    return { error: "Invalid assigned user ID", status: 400 };
  }

  const assignee = await User.findById(assignedTo).select("_id name email");

  if (!assignee) {
    return { error: "Assigned user not found", status: 404 };
  }

  const isOwner = project.owner.toString() === assignedTo.toString();
  const isMember = project.members.some((member) => member.toString() === assignedTo.toString());

  if (!isOwner && !isMember) {
    return { error: "Assigned user must belong to the project", status: 400 };
  }

  return { assigneeId: assignedTo, assignee };
};

const canAccessProject = (project, userId) =>
  project.owner.toString() === userId
  || project.members.some((member) => member.toString() === userId);

const resolveProjectForUser = async (projectId, userId) => {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    return { error: "Invalid project ID", status: 400 };
  }

  const project = await Project.findById(projectId);

  if (!project) {
    return { error: "Project not found", status: 404 };
  }

  if (!canAccessProject(project, userId)) {
    return { error: "Only project members can access this project", status: 403 };
  }

  return { project };
};

const createTaskForProject = async (payload, project, actor) => {
  const { title, description, assignedTo, dueDate, priority, status } = payload;
  const actorId = normalizeUserId(actor?.id || actor?._id);
  const normalizedStatus = normalizeTaskStatus(status) || "todo";
  const normalizedPriority = priority || "medium";

  if (!title) {
    return { error: "Task title is required", status: 400 };
  }

  if (!validStatuses.includes(normalizedStatus)) {
    return { error: "Status must be todo, in_progress, or done", status: 400 };
  }

  if (!validPriorities.includes(normalizedPriority)) {
    return { error: "Priority must be low, medium, high, or urgent", status: 400 };
  }

  if (!actorId) {
    return { error: "Authenticated user is invalid", status: 401 };
  }

  const { assigneeId, assignee, error, status: assigneeStatus } =
    await ensureAssigneeBelongsToProject(assignedTo, project);

  if (error) {
    return { error, status: assigneeStatus };
  }

  const task = await Task.create({
    title,
    description,
    status: normalizedStatus,
    priority: normalizedPriority,
    assignedTo: assigneeId,
    createdBy: actorId,
    dueDate: dueDate || null,
    projectId: project._id,
  });

  const actorName = actor?.name || "A user";

  const activity = await createActivity({
    type: "task_created",
    userId: actorId,
    projectId: project._id,
    message: `${actorName} created task ${task.title} in ${project.name}`,
  });

  let notification = null;

  if (assigneeId && assigneeId.toString() !== actorId.toString()) {
    notification = await createNotification({
      type: "task_assigned",
      userId: assigneeId,
      projectId: project._id,
      taskId: task._id,
      message: `${actorName} assigned you task ${task.title} in ${project.name}.`,
    });
  }

  const populatedTask = await populateTask(Task.findById(task._id));

  emitProjectEvent(project._id.toString(), "taskCreated", {
    task: populatedTask,
    projectId: project._id.toString(),
    activity: serializeActivityPayload(activity, {
      actor,
      project,
    }),
  });

  if (notification) {
    emitUserEvent(assigneeId.toString(), "notification", {
      notification: serializeNotificationPayload(notification),
      type: "taskAssigned",
      task: populatedTask,
      project: serializeProjectSummary(project),
      actor: serializeUserSummary(actor),
    });
  }

  return { task: populatedTask, assignee };
};

const createTask = async (req, res) => {
  try {
    const { task, error, status } = await createTaskForProject(req.body, req.project, req.user);

    if (error) {
      return res.status(status).json({ message: error });
    }

    return res.status(201).json(task);
  } catch (error) {
    console.error("Task create error:", error.message);
    return res.status(500).json({ message: "Unable to create task" });
  }
};

const createTaskFromBody = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);

    if (!userId) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    const { projectId } = req.body;
    const { project, error, status } = await resolveProjectForUser(projectId, userId);

    if (error) {
      return res.status(status).json({ message: error });
    }

    const result = await createTaskForProject(req.body, project, req.user);

    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }

    return res.status(201).json(result.task);
  } catch (error) {
    console.error("Task create error:", error.message);
    return res.status(500).json({ message: "Unable to create task" });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const tasks = await populateTask(
      Task.find({ projectId: req.project._id }).sort({ createdAt: -1 })
    );

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Task fetch error:", error.message);
    return res.status(500).json({ message: "Unable to fetch tasks" });
  }
};

const getTasks = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);

    if (!userId) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    if (req.query.projectId) {
      const { project, error, status } = await resolveProjectForUser(req.query.projectId, userId);

      if (error) {
        return res.status(status).json({ message: error });
      }

      const projectTasks = await populateTask(
        Task.find({ projectId: project._id }).sort({ createdAt: -1 })
      );

      return res.status(200).json(projectTasks);
    }

    const visibleProjects = await Project.find({
      $or: [{ owner: userId }, { members: userId }],
    }).select("_id");

    const projectIds = visibleProjects.map((project) => project._id);

    if (!projectIds.length) {
      return res.status(200).json([]);
    }

    const tasks = await populateTask(
      Task.find({
        projectId: mongoose.trusted({ $in: projectIds }),
      }).sort({ createdAt: -1 })
    );

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Task list error:", error.message);
    return res.status(500).json({ message: "Unable to fetch tasks" });
  }
};

const getTaskFiles = async (req, res) => {
  try {
    const files = await populateTaskFiles(
      TaskFile.find({ taskId: req.task._id }).sort({ createdAt: -1 })
    );

    return res.status(200).json(files);
  } catch (error) {
    console.error("Task file fetch error:", error.message);
    return res.status(500).json({ message: "Unable to fetch task files" });
  }
};

const createTaskFile = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);
    const { fileName, fileUrl, fileType, fileSize } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    if (!validTaskFileTypes.has(fileType)) {
      return res.status(400).json({ message: "File type is not allowed" });
    }

    if (!Number.isInteger(fileSize) || fileSize < 1 || fileSize > maxTaskFileSize) {
      return res.status(400).json({ message: "Files must be 5MB or smaller" });
    }

    const taskFile = await TaskFile.create({
      fileName,
      fileUrl,
      fileType,
      fileSize,
      taskId: req.task._id,
      uploadedBy: userId,
    });

    const populatedTaskFile = await populateTaskFiles(TaskFile.findById(taskFile._id));

    return res.status(201).json(populatedTaskFile);
  } catch (error) {
    console.error("Task file create error:", error.message);
    return res.status(500).json({ message: "Unable to save task file" });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, status, assignedTo, dueDate, priority } = req.body;
    const task = req.task;
    const project = req.project;
    const actorId = normalizeUserId(req.user?.id || req.user?._id);
    const normalizedStatus = status !== undefined ? normalizeTaskStatus(status) : undefined;

    if (task.projectId.toString() !== project._id.toString()) {
      return res.status(403).json({ message: "Task does not belong to this project" });
    }

    if (normalizedStatus && !validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ message: "Status must be todo, in_progress, or done" });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ message: "Priority must be low, medium, high, or urgent" });
    }

    const previousAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;
    const previousStatus = task.status;

    const { assigneeId, assignee, error, status: assigneeStatus } =
      await ensureAssigneeBelongsToProject(assignedTo, project);

    if (error) {
      return res.status(assigneeStatus).json({ message: error });
    }

    if (typeof title === "string") {
      task.title = title;
    }

    if (typeof description === "string") {
      task.description = description;
    }

    if (normalizedStatus) {
      task.status = normalizedStatus;
    }

    if (priority) {
      task.priority = priority;
    }

    if (assignedTo !== undefined) {
      task.assignedTo = assigneeId;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate || null;
    }

    await task.save();

    const activity = await createActivity({
      type: "task_updated",
      userId: actorId,
      projectId: project._id,
      message: `${req.user.name || "A user"} updated task ${task.title} in ${project.name}`,
    });

    if (task.status === "done" && previousStatus !== "done") {
      await createActivity({
        type: "task_completed",
        userId: actorId,
        projectId: project._id,
        message: `${req.user.name || "A user"} completed task ${task.title} in ${project.name}`,
      });
    }

    let notification = null;
    let completionNotification = null;

    if (
      assigneeId
      && assigneeId.toString() !== actorId
      && assigneeId.toString() !== previousAssignedTo
    ) {
      notification = await createNotification({
        type: "task_assigned",
        userId: assigneeId,
        projectId: project._id,
        taskId: task._id,
        message: `${req.user.name || "A user"} assigned you task ${task.title} in ${project.name}.`,
      });
    }

    if (task.status === "done" && previousStatus !== "done") {
      const completionRecipients = [
        project.owner?.toString(),
        task.createdBy?.toString(),
        previousAssignedTo,
      ].filter((recipientId) => recipientId && recipientId !== actorId);

      const uniqueRecipientIds = [...new Set(completionRecipients)];

      if (uniqueRecipientIds.length) {
        const completionMessage = `${req.user.name || "A user"} completed task ${task.title} in ${project.name}.`;
        const notifications = await Promise.all(
          uniqueRecipientIds.map((recipientId) =>
            createNotification({
              type: "task_completed",
              userId: recipientId,
              projectId: project._id,
              taskId: task._id,
              message: completionMessage,
            })
          )
        );

        completionNotification = notifications.filter(Boolean);
      }
    }

    const updatedTask = await populateTask(Task.findById(task._id));

    emitProjectEvent(project._id.toString(), "taskUpdated", {
      task: updatedTask,
      projectId: project._id.toString(),
      activity: serializeActivityPayload(activity, {
        actor: req.user,
        project,
      }),
    });

    if (notification) {
      emitUserEvent(assigneeId.toString(), "notification", {
        notification: serializeNotificationPayload(notification),
        type: "taskAssigned",
        task: updatedTask,
        project: serializeProjectSummary(project),
        actor: serializeUserSummary(req.user),
      });
    }

    if (completionNotification?.length) {
      completionNotification.forEach((entry) => {
        emitUserEvent(entry.userId.toString(), "notification", {
          notification: serializeNotificationPayload(entry),
          type: "taskCompleted",
          task: updatedTask,
          project: serializeProjectSummary(project),
          actor: serializeUserSummary(req.user),
        });
      });
    }

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Task update error:", error.message);
    return res.status(500).json({ message: "Unable to update task" });
  }
};

const deleteTask = async (req, res) => {
  try {
    await createActivity({
      type: "task_deleted",
      userId: normalizeUserId(req.user?.id || req.user?._id),
      projectId: req.project._id,
      message: `${req.user.name || "A user"} deleted task ${req.task.title} from ${req.project.name}`,
    });

    await TaskFile.deleteMany({ taskId: req.task._id });
    await req.task.deleteOne();
    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Task delete error:", error.message);
    return res.status(500).json({ message: "Unable to delete task" });
  }
};

module.exports = {
  createTask,
  createTaskFromBody,
  getProjectTasks,
  getTasks,
  getTaskFiles,
  createTaskFile,
  updateTask,
  deleteTask,
};
