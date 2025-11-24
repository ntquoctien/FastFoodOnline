import mongoose from "mongoose";

const geocodeCacheSchema = new mongoose.Schema(
  {
    addressKey: { type: String, required: true, unique: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    provider: { type: String, default: "nominatim" },
  },
  {
    collection: "geocodeCache",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

geocodeCacheSchema.index({ addressKey: 1 }, { unique: true });

const GeocodeCacheModel =
  mongoose.models.GeocodeCache || mongoose.model("GeocodeCache", geocodeCacheSchema);

export default GeocodeCacheModel;
