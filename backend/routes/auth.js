const express = require("express");
const { validateWithZod } = require("../middleware/zodValidation");
const {
  registerUser,
  loginUser,
  googleAuth,
  refreshAccessToken,
  logoutUser,
  getMe,
  updateProfile,
  deleteAccount,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");
const {
  registerSchema,
  loginSchema,
  googleSchema,
  profileSchema,
} = require("../validation/schemas");

const router = express.Router();

router.post("/register", authLimiter, validateWithZod({ body: registerSchema }), registerUser);
router.post("/login", authLimiter, validateWithZod({ body: loginSchema }), loginUser);
router.post("/google", authLimiter, validateWithZod({ body: googleSchema }), googleAuth);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.get("/me", protect, getMe);
router.patch("/profile", protect, validateWithZod({ body: profileSchema }), updateProfile);
router.delete("/delete-account", protect, deleteAccount);

module.exports = router;
