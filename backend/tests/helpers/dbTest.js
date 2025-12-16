import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../../db.js";
import { applyTestEnv } from "./testEnv.js";

export const connectTestDb = async () => {
  applyTestEnv();
  await connectDb(process.env.MONGO_URL);
};

export const cleanupDb = async () => {
  if (mongoose.connection?.db) {
    await mongoose.connection.db.dropDatabase();
  }
};

export const disconnectTestDb = async () => {
  await disconnectDb();
};

export default { connectTestDb, cleanupDb, disconnectTestDb };

