const mongoose = require("mongoose");
const dns = require("dns").promises;
const env = require("./env");

const connectDatabase = async () => {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is required");
  }

  // Fix for DNS resolution issues with MongoDB Atlas
  // Set DNS servers to Cloudflare (1.1.1.1) or Google (8.8.8.8)
  dns.setServers(["1.1.1.1", "8.8.8.8"]);

  await mongoose.connect(env.mongodbUri);
};

module.exports = { connectDatabase };
