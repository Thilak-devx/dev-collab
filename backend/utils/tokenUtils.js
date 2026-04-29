const jwt = require("jsonwebtoken");
const { isProduction } = require("../config/env");

const normalizeTokenUserId = (userId) => {
  if (!userId) {
    throw new Error("A valid user ID is required to generate tokens");
  }

  if (typeof userId === "string") {
    return userId;
  }

  const normalizedUserId = userId.toString?.();

  if (!normalizedUserId || normalizedUserId === "[object Object]") {
    throw new Error("User ID must be a string-compatible value");
  }

  return normalizedUserId;
};

const getBaseCookieOptions = () => ({
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  path: "/",
});

const getAccessCookieOptions = () => ({
  ...getBaseCookieOptions(),
  maxAge: 60 * 60 * 1000,
});

const getRefreshCookieOptions = () => ({
  ...getBaseCookieOptions(),
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const generateAccessToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id: normalizeTokenUserId(userId) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
};

const generateRefreshToken = (userId) => {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("REFRESH_TOKEN_SECRET is not configured");
  }

  return jwt.sign({ id: normalizeTokenUserId(userId) }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });
};

const setAccessTokenCookie = (res, accessToken) => {
  res.cookie("accessToken", accessToken, getAccessCookieOptions());
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());
};

const clearAccessTokenCookie = (res) => {
  const { maxAge, ...cookieOptions } = getAccessCookieOptions();
  res.clearCookie("accessToken", cookieOptions);
};

const clearRefreshTokenCookie = (res) => {
  const { maxAge, ...cookieOptions } = getRefreshCookieOptions();
  res.clearCookie("refreshToken", cookieOptions);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
};
