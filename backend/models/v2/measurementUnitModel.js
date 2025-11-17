import mongoose from "mongoose";

const measurementUnitSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    label: { type: String, required: true, trim: true },
    value: { type: Number, default: 0 },
    symbol: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0 },
    description: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  {
    collection: "measurementUnits",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

measurementUnitSchema.index(
  { type: 1, label: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

const MeasurementUnitModel =
  mongoose.models.MeasurementUnit ||
  mongoose.model("MeasurementUnit", measurementUnitSchema);

export default MeasurementUnitModel;
