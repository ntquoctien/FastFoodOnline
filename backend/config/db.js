import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

// Load backend/.env when running from the repo root (npm scripts, nodemon, etc.)
dotenv.config({ path: envPath });

export const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    const hint =
      "Missing MONGO_URL. Run the backend from the backend folder or update backend/.env (or docker-compose).";
    throw new Error(hint);
  }

  try {
    const connection = await mongoose.connect(mongoUrl);
    console.log(`DB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.error(
      "Check Atlas credentials/IP or ensure the mongo container is running (docker compose logs mongo)."
    );
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
    throw error;
  }
};
