import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import DroneModel from "../models/v2/droneModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const SHIPPER_COLLECTION = "shipperprofiles";
const DEFAULT_PAYLOAD_KG =
  Number(process.env.MIGRATE_DRONE_PAYLOAD_KG || 3) || 3;

const statusMap = {
  available: "available",
  busy: "busy",
  inactive: "offline",
};

const migrate = async () => {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    throw new Error("MONGO_URL missing");
  }
  await mongoose.connect(mongoUrl);
  console.log("Connected to MongoDB");

  const shipperColl = mongoose.connection.collection(SHIPPER_COLLECTION);
  const exists = await shipperColl
    .listIndexes()
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    console.log("No legacy shipper collection found");
    return;
  }

  const shippers = await shipperColl.find({}).toArray();
  if (!shippers.length) {
    console.log("No shipper profiles to migrate");
  } else {
    let created = 0;
    for (let i = 0; i < shippers.length; i += 1) {
      const shipper = shippers[i];
      const code =
        shipper.licensePlate ||
        `DRN-MIG-${String(shipper.branchId || "GEN").slice(-4)}-${i + 1}`;
      const existsCode = await DroneModel.findOne({ code });
      if (existsCode) {
        continue;
      }
      await DroneModel.create({
        code,
        branchId: shipper.branchId || undefined,
        status: statusMap[shipper.status] || "offline",
        batteryLevel: 100,
        maxPayloadKg: DEFAULT_PAYLOAD_KG,
        lastKnownLat: undefined,
        lastKnownLng: undefined,
      });
      created += 1;
    }
    console.log(`Migrated ${created} shipper profiles into drones`);
  }

  try {
    await shipperColl.drop();
    console.log("Dropped legacy shipperprofiles collection");
  } catch (error) {
    console.warn("Could not drop shipperprofiles:", error.message);
  }

  await mongoose.disconnect();
};

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exitCode = 1;
});
