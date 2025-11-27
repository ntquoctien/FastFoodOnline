import mongoose from "mongoose";

// Reusable address sub-schema
export const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    ward: { type: String, trim: true },
    district: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true, default: "Vietnam" },
    fullText: { type: String, trim: true },
  },
  { _id: false }
);

// GeoJSON Point sub-schema
export const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      // expecting [lng, lat]
      validate: {
        validator: (val) => Array.isArray(val) && val.length === 2,
        message: "Coordinates must be an array of [lng, lat]",
      },
    },
  },
  { _id: false }
);

export default {
  addressSchema,
  locationSchema,
};
