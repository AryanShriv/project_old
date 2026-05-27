const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/database");
const { ensureAdminUser } = require("./config/seedAdmin");

const start = async () => {
  try {
    await connectDatabase();
    await ensureAdminUser();
    app.listen(env.port, () => {
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
