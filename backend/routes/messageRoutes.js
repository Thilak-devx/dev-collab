const express = require("express");
const { z } = require("zod");
const { protect } = require("../middleware/authMiddleware");
const { loadProject, requireProjectMember } = require("../middleware/projectAccessMiddleware");
const { validateWithZod } = require("../middleware/zodValidation");
const {
  createMessage,
  getMessagesByChannel,
  getProjectMessages,
} = require("../controllers/messageController");
const {
  directMessageCreateSchema,
  resourceIdParamsSchema,
} = require("../validation/schemas");

const router = express.Router();
const projectIdParamsSchema = z.object({
  projectId: resourceIdParamsSchema.shape.id,
});
const channelIdParamsSchema = z.object({
  channelId: resourceIdParamsSchema.shape.id,
});

router.use(protect);

router.post("/", validateWithZod({ body: directMessageCreateSchema }), createMessage);
router.get(
  "/:channelId",
  validateWithZod({ params: channelIdParamsSchema }),
  getMessagesByChannel
);

router.get(
  "/project/:projectId",
  validateWithZod({ params: projectIdParamsSchema }),
  loadProject,
  requireProjectMember,
  getProjectMessages
);

module.exports = router;
