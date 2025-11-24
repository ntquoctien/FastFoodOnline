import process from "node:process";
import { connectDB } from "../config/db.js";
import * as branchRepo from "../repositories/v2/branchRepository.js";
import * as droneRepo from "../repositories/v2/droneRepository.js";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--branch" || arg === "-b") {
      result.branchId = args[i + 1];
      i += 1;
    } else if (arg === "--count" || arg === "-c") {
      result.count = Number(args[i + 1]);
      i += 1;
    } else if (arg === "--prefix" || arg === "-p") {
      result.prefix = args[i + 1];
      i += 1;
    } else if (arg === "--payload" || arg === "--maxPayloadKg") {
      result.maxPayloadKg = Number(args[i + 1]);
      i += 1;
    }
  }
  return result;
};

const seed = async () => {
  const { branchId, count = 3, prefix = "DRN", maxPayloadKg } = parseArgs();
  if (!branchId) {
    console.error(
      "Usage: node scripts/seed-drones.js --branch <branchId> [--count 3] [--prefix DRN] [--payload 3]"
    );
    process.exit(1);
  }

  await connectDB();
  const branch = await branchRepo.findById(branchId);
  if (!branch) {
    console.error("Branch not found:", branchId);
    process.exit(1);
  }
  const safeCount = Math.min(Math.max(count || 1, 1), 20);
  const created = [];
  for (let i = 0; i < safeCount; i += 1) {
    const code = `${prefix}-${String(branchId).slice(-4)}-${i + 1}`;
    try {
      // eslint-disable-next-line no-await-in-loop
      const drone = await droneRepo.create({
        code,
        branchId: branch._id,
        status: "available",
        batteryLevel: 100,
        maxPayloadKg: Number.isFinite(maxPayloadKg) && maxPayloadKg > 0 ? maxPayloadKg : 3,
      });
      created.push(drone.code);
    } catch (error) {
      if (error.code === 11000) {
        continue;
      }
      throw error;
    }
  }
  console.log("Seeded drones:", created);
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed drones failed:", err);
  process.exit(1);
});
