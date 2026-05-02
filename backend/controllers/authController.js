const mongoose = require("mongoose");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const Invite = require("../models/Invite");
const Message = require("../models/Message");
const ProjectChannel = require("../models/ProjectChannel");
const TaskFile = require("../models/TaskFile");
const { createActivity } = require("../utils/activityUtils");
const {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  generateAccessToken,
  generateRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} = require("../utils/tokenUtils");

const getGoogleClient = () => new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

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

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const logSecurityEvent = (type, details) => {
  console.warn(`[SECURITY] ${type}: ${details}`);
};

const clearFailedLoginState = async (user) => {
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();
};

const recordFailedLogin = async (user, source) => {
  if (!user) {
    logSecurityEvent("FAILED_LOGIN", `Unknown account attempt from ${source}`);
    return;
  }

  if (user.lockUntil && user.lockUntil < Date.now()) {
    user.loginAttempts = 0;
    user.lockUntil = null;
  }

  user.loginAttempts += 1;

  if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
    logSecurityEvent("ACCOUNT_LOCKED", `${user.email} locked after repeated failed login attempts`);
  } else {
    logSecurityEvent("FAILED_LOGIN", `${user.email} failed login attempt ${user.loginAttempts}`);
  }

  await user.save();
};

const persistRefreshToken = async (user, refreshToken) => {
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();
};

const buildAuthPayload = async (res, user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  await persistRefreshToken(user, refreshToken);
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);

  return {
    user: serializeUser(user),
  };
};

const verifyGoogleToken = async (token) => {
  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  return ticket.getPayload();
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
    });

    return res.status(201).json({
      ...(await buildAuthPayload(res, user)),
    });
  } catch (error) {
    console.error("User save error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid user data provided" });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }

    return res.status(500).json({ message: "Unable to register user" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +loginAttempts +lockUntil +refreshTokenHash"
    );

    if (!user) {
      await recordFailedLogin(null, req.ip);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isLocked) {
      logSecurityEvent("LOCKED_ACCOUNT_ATTEMPT", `${user.email} attempted login while locked`);
      return res.status(423).json({ message: "Account temporarily locked. Please try again later." });
    }

    if (!user.password) {
      return res.status(400).json({ message: "This account uses Google sign-in" });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      await recordFailedLogin(user, req.ip);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await clearFailedLoginState(user);

    return res.status(200).json({
      ...(await buildAuthPayload(res, user)),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to login" });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google OAuth is not configured" });
    }

    console.log("Incoming Google token:", req.body.token);
    console.log("Backend CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);

    let payload;

    try {
      payload = await verifyGoogleToken(token);
    } catch (error) {
      console.error("Google verify error:", error);
      return res.status(401).json({ message: "Invalid Google token" });
    }

    if (!payload || !payload.email || !payload.sub) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const normalizedEmail = payload.email.toLowerCase();
    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email: normalizedEmail }],
    }).select("+refreshTokenHash");

    if (!user) {
      user = await User.create({
        name: payload.name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        googleId: payload.sub,
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;

      if (!user.name && payload.name) {
        user.name = payload.name;
      }

      await user.save();
    }

    return res.status(200).json({
      ...(await buildAuthPayload(res, user)),
    });
  } catch (error) {
    const failureReason = error?.message || "Unknown Google auth error";
    logSecurityEvent("GOOGLE_AUTH_FAILURE", `Google auth failed from ${req.ip}: ${failureReason}`);
    return res.status(401).json({ message: "Google authentication failed" });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    if (!process.env.REFRESH_TOKEN_SECRET) {
      return res.status(500).json({ message: "Refresh token secret is not configured" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const userId = normalizeUserId(decoded?.id || decoded?._id);

    if (!userId) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(userId).select("+refreshTokenHash");

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const isRefreshTokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!isRefreshTokenMatch) {
      logSecurityEvent("REFRESH_TOKEN_MISMATCH", `Refresh token mismatch for user ${userId}`);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    return res.status(200).json({
      ...(await buildAuthPayload(res, user)),
    });
  } catch (error) {
    return res.status(401).json({ message: "Refresh token expired or invalid" });
  }
};

const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken && process.env.REFRESH_TOKEN_SECRET) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const userId = normalizeUserId(decoded?.id || decoded?._id);

        if (!userId) {
          throw new Error("Invalid refresh token user");
        }

        const user = await User.findById(userId).select("+refreshTokenHash");

        if (user) {
          user.refreshTokenHash = null;
          await user.save();
        }
      } catch (error) {
        logSecurityEvent("LOGOUT_WITH_INVALID_REFRESH_TOKEN", `Invalid logout token from ${req.ip}`);
      }
    }

    clearRefreshTokenCookie(res);
    clearAccessTokenCookie(res);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to logout" });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);

    if (!userId) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(serializeUser(user));
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch user" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);
    const { name, email } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }

    if (typeof email === "string" && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userId },
      }).select("_id");

      if (existingUser) {
        return res.status(409).json({ message: "Email is already in use" });
      }

      user.email = normalizedEmail;
    }

    await user.save();

    await createActivity({
      type: "profile_updated",
      userId,
      message: `${user.name} updated their profile`,
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Profile update error:", error.message);
    return res.status(500).json({ message: "Unable to update profile" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    const user = await User.findById(userId).select("_id email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ownedProjects = await Project.find({ owner: userId }).select("_id");
    const ownedProjectIds = ownedProjects.map((project) => project._id);

    if (ownedProjectIds.length) {
      const ownedTasks = await Task.find({
        projectId: mongoose.trusted({ $in: ownedProjectIds }),
      }).select("_id");
      const ownedTaskIds = ownedTasks.map((task) => task._id);

      await Task.deleteMany({
        projectId: mongoose.trusted({ $in: ownedProjectIds }),
      });
      if (ownedTaskIds.length) {
        await TaskFile.deleteMany({
          taskId: mongoose.trusted({ $in: ownedTaskIds }),
        });
      }
      await Message.deleteMany({
        projectId: mongoose.trusted({ $in: ownedProjectIds }),
      });
      await ProjectChannel.deleteMany({
        projectId: mongoose.trusted({ $in: ownedProjectIds }),
      });
    }

    await Task.deleteMany({
      $or: [{ assignedTo: userId }, { createdBy: userId }],
    });
    await TaskFile.deleteMany({ uploadedBy: userId });
    await Message.deleteMany({ senderId: userId });
    await ProjectChannel.deleteMany({ createdBy: userId, isDefault: false });
    await Project.updateMany({ members: userId }, { $pull: { members: userId } });
    await Activity.deleteMany({
      $or: [
        { userId },
        ...(ownedProjectIds.length
          ? [{ projectId: mongoose.trusted({ $in: ownedProjectIds }) }]
          : []),
      ],
    });
    await Notification.deleteMany({ userId });
    await Invite.deleteMany({
      $or: [
        { createdBy: userId },
        ...(ownedProjectIds.length
          ? [{ projectId: mongoose.trusted({ $in: ownedProjectIds }) }]
          : []),
      ],
    });

    if (ownedProjectIds.length) {
      await Project.deleteMany({
        _id: mongoose.trusted({ $in: ownedProjectIds }),
      });
    }

    await User.findByIdAndDelete(userId);
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error.message);
    return res.status(500).json({ message: "Unable to delete account" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
  refreshAccessToken,
  logoutUser,
  getMe,
  updateProfile,
  deleteAccount,
};
