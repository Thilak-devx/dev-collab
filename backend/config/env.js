const isProduction = process.env.NODE_ENV === "production";

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

module.exports = {
  getPrimaryClientUrl,
  getRequiredClientUrl,
  isProduction,
  parseAllowedOrigins,
};
