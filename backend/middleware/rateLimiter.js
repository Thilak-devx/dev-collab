const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    console.warn(`Rate limit hit for IP ${req.ip} on ${req.originalUrl}`);
    res.status(429).json({ message: "Too many authentication attempts. Please try again later." });
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
