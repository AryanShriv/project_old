const mongoose = require("mongoose");
const env = require("./env");

const connectDatabase = async () => {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(env.mongodbUri);
};

module.exports = { connectDatabase };
