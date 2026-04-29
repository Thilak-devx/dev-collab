const express = require("express");
const { validateWithZod } = require("../middleware/zodValidation");
const {
  createTaskFromBody,
  getTasks,
  updateTask,
  deleteTask,
  getTaskFiles,
  createTaskFile,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const { loadTaskProject } = require("../middleware/taskAccessMiddleware");
const {
  resourceIdParamsSchema,
  taskCreateSchema,
  taskFileCreateSchema,
  taskQuerySchema,
  taskUpdateSchema,
} = require("../validation/schemas");

const router = express.Router();

router.use(protect);

router.post("/", validateWithZod({ body: taskCreateSchema }), createTaskFromBody);
router.get("/", validateWithZod({ query: taskQuerySchema }), getTasks);
router.get("/:id/files", validateWithZod({ params: resourceIdParamsSchema }), loadTaskProject, getTaskFiles);
router.post("/:id/files", validateWithZod({ params: resourceIdParamsSchema, body: taskFileCreateSchema }), loadTaskProject, createTaskFile);
router.patch("/:id", validateWithZod({ params: resourceIdParamsSchema, body: taskUpdateSchema }), loadTaskProject, updateTask);
router.delete("/:id", validateWithZod({ params: resourceIdParamsSchema }), loadTaskProject, deleteTask);

module.exports = router;
