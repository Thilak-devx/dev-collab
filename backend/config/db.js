const mongoose = require("mongoose");

mongoose.set("strictQuery", true);
mongoose.set("sanitizeFilter", true);

const ensureDatabaseName = (mongoUri) => {
  if (!mongoUri) {
    return mongoUri;
  }

  const [baseUri, queryString] = mongoUri.split("?");
  const normalizedBaseUri = baseUri.replace(/\/+$/, "");
  const hasDatabaseName = /\/[^/]+$/.test(normalizedBaseUri);

  if (hasDatabaseName) {
    return queryString ? `${normalizedBaseUri}?${queryString}` : normalizedBaseUri;
  }

  const uriWithDatabase = `${normalizedBaseUri}/devcollab`;
  return queryString ? `${uriWithDatabase}?${queryString}` : uriWithDatabase;
};

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured");
    }

    const mongoUri = ensureDatabaseName(process.env.MONGO_URI.trim());
    const connection = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${connection.connection.host}/${connection.connection.name}`);
    return connection;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
};

module.exports = connectDB;
