import mongoose from "mongoose";

const droneAssignmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    droneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drone",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "assigned",
        "en_route_pickup",
        "at_pickup",
        "en_route_dropoff",
        "delivered",
        "cancelled",
        "failed",
      ],
      default: "assigned",
    },
    assignedAt: { type: Date, default: Date.now },
    enRoutePickupAt: { type: Date },
    pickedAt: { type: Date },
    enRouteDropoffAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    failedAt: { type: Date },
    meta: { type: Object },
  },
  {
    collection: "droneAssignments",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

droneAssignmentSchema.index({ droneId: 1, status: 1 });

const DroneAssignmentModel =
  mongoose.models.DroneAssignment ||
  mongoose.model("DroneAssignment", droneAssignmentSchema);

export default DroneAssignmentModel;
