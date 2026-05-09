const isProduction = process.env.NODE_ENV === "production";

const normalizeEnvValue = (value) => (typeof value === "string" ? value.trim() : "");

const hasPlaceholderValue = (value) => {
  const normalizedValue = normalizeEnvValue(value).toLowerCase();

  if (!normalizedValue) {
    return true;
  }

  return [
    "replace_with_",
    "your_",
    "<username>",
    "<password>",
    "changeme",
    "example",
  ].some((fragment) => normalizedValue.includes(fragment));
};

const parseAllowedOrigins = () => {
  const configuredOrigins = process.env.CLIENT_URL || "";
  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const getPrimaryClientUrl = () => parseAllowedOrigins()[0] || "";

const getRequiredClientUrl = () => {
  const clientUrl = getPrimaryClientUrl();

  if (!clientUrl) {
    throw new Error("CLIENT_URL is not configured");
  }

  return clientUrl;
};

const validateServerEnv = () => {
  const requiredKeys = [
    "MONGO_URI",
    "JWT_SECRET",
    "REFRESH_TOKEN_SECRET",
    "CLIENT_URL",
    "GOOGLE_CLIENT_ID",
  ];
  const errors = [];

  requiredKeys.forEach((key) => {
    const value = normalizeEnvValue(process.env[key]);

    if (!value) {
      errors.push(`${key} is required`);
      return;
    }

    if (hasPlaceholderValue(value)) {
      errors.push(`${key} must be replaced with a real value`);
    }
  });

  const mongoUri = normalizeEnvValue(process.env.MONGO_URI);
  if (mongoUri && !/^mongodb(\+srv)?:\/\//i.test(mongoUri)) {
    errors.push("MONGO_URI must start with mongodb:// or mongodb+srv://");
  }

  const googleClientId = normalizeEnvValue(process.env.GOOGLE_CLIENT_ID);
  if (googleClientId && !googleClientId.endsWith(".apps.googleusercontent.com")) {
    errors.push("GOOGLE_CLIENT_ID must be a Google OAuth web client ID");
  }

  const invalidOrigins = parseAllowedOrigins().filter((origin) => !/^https?:\/\//i.test(origin));
  if (invalidOrigins.length) {
    errors.push(`CLIENT_URL contains invalid origin values: ${invalidOrigins.join(", ")}`);
  }

  if (errors.length) {
    throw new Error(`Environment validation failed: ${errors.join("; ")}`);
  }
};

module.exports = {
  getPrimaryClientUrl,
  getRequiredClientUrl,
  isProduction,
  parseAllowedOrigins,
  validateServerEnv,
};
