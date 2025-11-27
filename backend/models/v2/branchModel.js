import mongoose from "mongoose";
import { addressSchema, locationSchema } from "./commonSchemas.js";

const branchSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    hubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hub",
    },
    name: { type: String, required: true, trim: true },

    // Structured address + legacy flat fields for backward compatibility
    address: { type: addressSchema, default: {} },
    street: { type: String }, // LEGACY - use address.street instead
    district: { type: String }, // LEGACY - use address.district instead
    city: { type: String }, // LEGACY - use address.city instead
    country: { type: String, default: "Vietnam" },
    phone: { type: String },

    // GeoJSON point + legacy lat/lng
    location: { type: locationSchema },
    latitude: { type: Number }, // LEGACY - use location.coordinates[1]
    longitude: { type: Number }, // LEGACY - use location.coordinates[0]

    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    collection: "branches",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

branchSchema.index(
  { restaurantId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
branchSchema.index({ hubId: 1, isActive: 1 });
branchSchema.index({ location: "2dsphere" });

const BranchModel =
  mongoose.models.Branch || mongoose.model("Branch", branchSchema);

export default BranchModel;
