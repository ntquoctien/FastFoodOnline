import { connectDb } from "./db.js";
import { createApp } from "./app.js";
import { startDroneAssignRetry } from "./jobs/droneAssignmentRetry.js";

const port = process.env.PORT || 4000;

const main = async () => {
  await connectDb(process.env.MONGO_URL);

  const app = createApp();
  app.listen(port, () => {
    console.log(`Server Started on port: ${port}`);
  });

  startDroneAssignRetry();
};

main().catch((error) => {
  console.error("Backend startup failed:", error);
  process.exitCode = 1;
});
