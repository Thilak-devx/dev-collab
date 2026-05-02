const express = require("express");
const { validateWithZod } = require("../middleware/zodValidation");
const {
  createProject,
  getProjects,
  getProjectById,
  addProjectMembers,
  inviteProjectMember,
  deleteProject,
} = require("../controllers/projectController");
const {
  listProjectChannels,
  createProjectChannel,
  deleteProjectChannel,
  getChannelMessages,
  createChannelMessage,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");
const {
  loadProject,
  requireProjectMember,
  requireProjectManager,
  requireProjectOwner,
} = require("../middleware/projectAccessMiddleware");
const { createTask, getProjectTasks } = require("../controllers/taskController");
const {
  projectSchema,
  projectInviteSchema,
  projectMembersSchema,
  resourceIdParamsSchema,
  taskCreateSchema,
  messageCreateSchema,
  channelCreateSchema,
  channelMessagesQuerySchema,
} = require("../validation/schemas");

const router = express.Router();

router.use(protect);

router.post("/", validateWithZod({ body: projectSchema }), createProject);
router.get("/", getProjects);
router.get("/:id", validateWithZod({ params: resourceIdParamsSchema }), loadProject, requireProjectMember, getProjectById);
router.post("/:id/invite", validateWithZod({ params: resourceIdParamsSchema, body: projectInviteSchema }), loadProject, requireProjectOwner, inviteProjectMember);
router.put("/:id/members", validateWithZod({ params: resourceIdParamsSchema, body: projectMembersSchema }), loadProject, requireProjectOwner, addProjectMembers);
router.post("/:id/tasks", validateWithZod({ params: resourceIdParamsSchema, body: taskCreateSchema.omit({ projectId: true }) }), loadProject, requireProjectMember, createTask);
router.get("/:id/tasks", validateWithZod({ params: resourceIdParamsSchema }), loadProject, requireProjectMember, getProjectTasks);
router.get("/:id/channels", validateWithZod({ params: resourceIdParamsSchema }), loadProject, requireProjectMember, listProjectChannels);
router.post("/:id/channels", validateWithZod({ params: resourceIdParamsSchema, body: channelCreateSchema }), loadProject, requireProjectMember, createProjectChannel);
router.delete("/:id/channels/:channelId", validateWithZod({ params: resourceIdParamsSchema.extend({ channelId: resourceIdParamsSchema.shape.id }) }), loadProject, requireProjectMember, deleteProjectChannel);
router.get("/:id/channels/:channelId/messages", validateWithZod({ params: resourceIdParamsSchema.extend({ channelId: resourceIdParamsSchema.shape.id }), query: channelMessagesQuerySchema }), loadProject, requireProjectMember, getChannelMessages);
router.post("/:id/channels/:channelId/messages", validateWithZod({ params: resourceIdParamsSchema.extend({ channelId: resourceIdParamsSchema.shape.id }), body: messageCreateSchema }), loadProject, requireProjectMember, createChannelMessage);
router.delete("/:id", validateWithZod({ params: resourceIdParamsSchema }), loadProject, requireProjectManager, deleteProject);

module.exports = router;
