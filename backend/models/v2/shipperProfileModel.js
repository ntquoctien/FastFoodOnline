import mongoose from "mongoose";

const shipperProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    vehicleType: { type: String },
    licensePlate: { type: String },
    status: {
      type: String,
      enum: ["available", "busy", "inactive"],
      default: "inactive",
    },
  },
  {
    collection: "shipperProfiles",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

const ShipperProfileModel =
  mongoose.models.ShipperProfile ||
  mongoose.model("ShipperProfile", shipperProfileSchema);

export default ShipperProfileModel;
