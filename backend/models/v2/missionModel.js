import mongoose from "mongoose";
import { locationSchema } from "./commonSchemas.js";

const lineStringSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["LineString"],
      default: "LineString",
    },
    coordinates: {
      // GeoJSON LineString, mỗi điểm là [lng, lat].
      type: [[Number]],
      validate: {
        validator: (val) => Array.isArray(val) && val.length >= 2,
        message: "Route coordinates must contain at least two points",
      },
    },
  },
  { _id: false }
);

const missionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    droneId: { type: mongoose.Schema.Types.ObjectId, ref: "Drone", required: true },
    hubId: { type: mongoose.Schema.Types.ObjectId, ref: "Hub" },

    status: {
      type: String,
      enum: [
        "PLANNED",
        "EN_ROUTE_PICKUP",
        "AT_PICKUP",
        "EN_ROUTE_DELIVERY",
        "ARRIVED",
        "DELIVERED",
        "RETURNING",
        "COMPLETED",
        "CANCELED",
      ],
      default: "PLANNED",
    },

    route: { type: lineStringSchema },
    waypoints: [{ type: String }],

    totalDistanceKm: { type: Number },
    estDurationMinutes: { type: Number },
    startedAt: { type: Date },
    finishedAt: { type: Date },

    // Optional start/end locations for quick lookup
    startLocation: { type: locationSchema },
    endLocation: { type: locationSchema },
  },
  {
    collection: "missions",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

missionSchema.index({ status: 1 });
missionSchema.index({ route: "2dsphere" });

const MissionModel =
  mongoose.models.Mission || mongoose.model("Mission", missionSchema);

export default MissionModel;
