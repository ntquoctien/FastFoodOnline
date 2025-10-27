import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    isManuallyDisabled: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  {
    collection: "foods",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

foodSchema.index({ categoryId: 1, name: 1 }, { unique: true });

const FoodModel = mongoose.models.Food || mongoose.model("Food", foodSchema);

export default FoodModel;
