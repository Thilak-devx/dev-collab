const express = require("express");
const { validateWithZod } = require("../middleware/zodValidation");
const {
  getNotifications,
  markNotificationRead,
  toggleNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");
const {
  notificationQuerySchema,
  notificationReadSchema,
  resourceIdParamsSchema,
} = require("../validation/schemas");

const router = express.Router();

router.use(protect);

router.get("/", validateWithZod({ query: notificationQuerySchema }), getNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id", validateWithZod({ params: resourceIdParamsSchema, body: notificationReadSchema }), toggleNotificationRead);
router.patch("/:id/read", validateWithZod({ params: resourceIdParamsSchema }), markNotificationRead);

module.exports = router;
