import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    street: { type: String },
    district: { type: String },
    city: { type: String },
    phone: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
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

const BranchModel =
  mongoose.models.Branch || mongoose.model("Branch", branchSchema);

export default BranchModel;
