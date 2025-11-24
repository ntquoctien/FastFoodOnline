import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import DroneModel from "../models/v2/droneModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const fix = async () => {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    throw new Error("MONGO_URL missing");
  }
  await mongoose.connect(mongoUrl);
  console.log("Connected to MongoDB");

  const toFix = await DroneModel.find({
    $or: [{ serialNumber: { $exists: false } }, { serialNumber: null }, { serialNumber: "" }],
  });
  if (!toFix.length) {
    console.log("No drones need serialNumber update");
  } else {
    for (const drone of toFix) {
      const newSerial = drone.code || `DRN-${String(drone._id).slice(-6)}`;
      // eslint-disable-next-line no-await-in-loop
      await DroneModel.updateOne({ _id: drone._id }, { $set: { serialNumber: newSerial } });
      console.log(`Updated drone ${drone._id} -> serialNumber=${newSerial}`);
    }
  }

  await mongoose.disconnect();
};

fix().catch((err) => {
  console.error("Fix drones serial failed:", err);
  process.exitCode = 1;
});
