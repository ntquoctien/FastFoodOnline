import mongoose from "mongoose";

const droneSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, unique: true },
    serialNumber: { type: String, trim: true, unique: true, sparse: true },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "busy", "offline", "maintenance"],
      default: "offline",
    },
    maxPayloadKg: { type: Number, default: 2 },
    batteryLevel: { type: Number, min: 0, max: 100 },
    lastKnownLat: { type: Number },
    lastKnownLng: { type: Number },
  },
  {
    collection: "drones",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

droneSchema.index({ branchId: 1, status: 1 });
droneSchema.index({ code: 1 }, { unique: true });
droneSchema.index({ serialNumber: 1 }, { unique: true, sparse: true });

const DroneModel = mongoose.models.Drone || mongoose.model("Drone", droneSchema);

export default DroneModel;
