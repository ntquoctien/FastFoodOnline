import mongoose from "mongoose";
import { addressSchema, locationSchema } from "./commonSchemas.js";

const hubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: addressSchema, default: {} },
    location: { type: locationSchema, required: true },
    serviceRadiusKm: { type: Number, default: 5 },
  },
  {
    collection: "hubs",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

hubSchema.index({ location: "2dsphere" });
hubSchema.index({ name: 1 }, { unique: true });

const HubModel = mongoose.models.Hub || mongoose.model("Hub", hubSchema);

export default HubModel;

