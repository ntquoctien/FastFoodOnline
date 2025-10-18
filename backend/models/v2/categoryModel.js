import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    collection: "categories",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

categorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

const CategoryModel =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

export default CategoryModel;
