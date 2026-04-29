const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const http = require("http");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const activityRoutes = require("./routes/activityRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const inviteRoutes = require("./routes/inviteRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { apiLimiter } = require("./middleware/rateLimiter");
const { sanitizeRequest } = require("./middleware/sanitizeMiddleware");
const { createSocketServer } = require("./socket/socketServer");
const { parseAllowedOrigins } = require("./config/env");

let compression = (_req, _res, next) => next();

try {
  compression = require("compression");
} catch (error) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("compression package is required in production");
  }
}

dotenv.config();
const app = express();
const allowedOrigins = parseAllowedOrigins();

if (!allowedOrigins.length) {
  throw new Error("CLIENT_URL is required to start the server");
}

app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cookieParser());
app.use(compression());
app.use(apiLimiter);
app.use(sanitizeRequest);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const corsError = new Error("CORS origin not allowed");
      corsError.statusCode = 403;
      return callback(corsError);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.get("/", (req, res) => {
  res.json({ message: "DevCollab API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/messages", messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let io;
let server;

const startServer = async () => {
  console.log("Connecting to MongoDB...");
  await connectDB();

  server = http.createServer(app);
  io = createSocketServer(server);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});

module.exports = {
  app,
  get io() {
    return io;
  },
  get server() {
    return server;
  },
};
