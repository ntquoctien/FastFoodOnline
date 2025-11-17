import mongoose from "mongoose";

const foodVariantSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    size: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    measurementUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeasurementUnit",
    },
    unitType: { type: String, trim: true },
    unitLabel: { type: String, trim: true },
    unitValue: { type: Number },
    unitSymbol: { type: String, trim: true },
    unitOrder: { type: Number },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isManuallyDisabled: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  {
    collection: "foodVariants",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

foodVariantSchema.index(
  { foodId: 1, branchId: 1, size: 1 },
  { unique: true }
);

const FoodVariantModel =
  mongoose.models.FoodVariant ||
  mongoose.model("FoodVariant", foodVariantSchema);

export default FoodVariantModel;
