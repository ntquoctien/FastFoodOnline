import mongoose from "mongoose";
import { locationSchema } from "./commonSchemas.js";

const droneSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, unique: true },
    name: { type: String, trim: true },
    serialNumber: { type: String, trim: true, unique: true, sparse: true },
    // New hub link (preferred); branch retained for compatibility
    hubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hub",
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    }, // LEGACY - use hubId/location instead
    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "ASSIGNED",
        "EN_ROUTE_PICKUP",
        "DELIVERING",
        "RETURNING",
        "CHARGING",
        "MAINTENANCE",
        // legacy values
        "available",
        "busy",
        "offline",
        "maintenance",
      ],
      default: "AVAILABLE",
    },
    batteryLevel: { type: Number, min: 0, max: 100 },
    speedKmh: { type: Number },
    maxPayloadKg: { type: Number, default: 2 },

    location: { type: locationSchema },
    // legacy lat/lng
    lastKnownLat: { type: Number }, // LEGACY - use location.coordinates[1]
    lastKnownLng: { type: Number }, // LEGACY - use location.coordinates[0]
  },
  {
    collection: "drones",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

droneSchema.index({ branchId: 1, status: 1 });
droneSchema.index({ hubId: 1, status: 1 });
droneSchema.index({ code: 1 }, { unique: true });
droneSchema.index({ serialNumber: 1 }, { unique: true, sparse: true });
droneSchema.index({ location: "2dsphere" });

const DroneModel = mongoose.models.Drone || mongoose.model("Drone", droneSchema);

export default DroneModel;
