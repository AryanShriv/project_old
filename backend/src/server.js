const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/database");
const { ensureAdminUser } = require("./config/seedAdmin");
const http = require("http");
const { initSocketServer } = require("./config/socketServer");
const { startRequestExpiryJob } = require("./modules/requests/requests.expiry");
const { startUnreadMessageEmailJob } = require("./modules/chat/chat.notifications");
const { ensureAvailabilityExpertId } = require("./migrations/availability-expert-id");

const start = async () => {
  try {
    await connectDatabase();
    await ensureAdminUser();
    // Keeps availability data in step with the code (freelancerId -> expertId); a no-op once done
    await ensureAvailabilityExpertId();
    const server = http.createServer(app);
    initSocketServer(server);
    startRequestExpiryJob();
    startUnreadMessageEmailJob();
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
