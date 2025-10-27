import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    phone: { type: String },
    email: { type: String },
    logoUrl: { type: String },
    cuisine: { type: String },
    policy: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    collection: "restaurants",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

restaurantSchema.index({ name: 1 }, { unique: true });

const RestaurantModel =
  mongoose.models.Restaurant || mongoose.model("Restaurant", restaurantSchema);

export default RestaurantModel;
