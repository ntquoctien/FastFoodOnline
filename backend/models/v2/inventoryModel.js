import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    foodVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodVariant",
      required: true,
    },
    quantity: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    collection: "inventory",
    timestamps: { createdAt: true, updatedAt: false },
  }
);

inventorySchema.index({ branchId: 1, foodVariantId: 1 }, { unique: true });

const InventoryModel =
  mongoose.models.Inventory ||
  mongoose.model("Inventory", inventorySchema);

export default InventoryModel;
