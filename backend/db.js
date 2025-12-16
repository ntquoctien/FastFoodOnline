import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadBackendEnv = () => {
  const envPath = path.resolve(__dirname, ".env");
  dotenv.config({ path: envPath });
};

export const connectDb = async (mongoUrl) => {
  if (!mongoUrl) {
    if (process.env.NODE_ENV !== "test") {
      loadBackendEnv();
    }
  }

  const resolvedUrl = mongoUrl || process.env.MONGO_URL;
  if (!resolvedUrl) {
    throw new Error(
      "Missing MONGO_URL. Set it in the environment (or backend/.env for local dev)."
    );
  }

  const connection = await mongoose.connect(resolvedUrl);
  if (process.env.NODE_ENV !== "test") {
    console.log(`DB Connected: ${connection.connection.host}`);
  }
  return connection;
};

export const disconnectDb = async () => {
  if (mongoose.connection?.readyState) {
    await mongoose.disconnect();
  }
};

export default { connectDb, disconnectDb };

