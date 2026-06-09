const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/database");
const { ensureAdminUser } = require("./config/seedAdmin");
const http = require("http");
const { initSocketServer } = require("./config/socketServer");

const start = async () => {
  try {
    await connectDatabase();
    await ensureAdminUser();
    const server = http.createServer(app);
    initSocketServer(server);
    server.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`API server running on port ${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

start();
