const express = require("express");
const {
  createInvite,
  getInviteDetails,
  joinInvite,
} = require("../controllers/inviteController");
const { protect } = require("../middleware/authMiddleware");
const { validateWithZod } = require("../middleware/zodValidation");
const { inviteCreateSchema, inviteTokenParamsSchema } = require("../validation/schemas");

const router = express.Router();

router.post("/", protect, validateWithZod({ body: inviteCreateSchema }), createInvite);
router.get("/:token", validateWithZod({ params: inviteTokenParamsSchema }), getInviteDetails);
router.post("/:token/join", protect, validateWithZod({ params: inviteTokenParamsSchema }), joinInvite);

module.exports = router;
