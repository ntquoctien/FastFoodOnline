import mongoose from "mongoose";

const deliveryAssignmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    shipperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShipperProfile",
      required: true,
    },
    status: {
      type: String,
      enum: ["assigned", "picked", "delivered", "cancelled"],
      default: "assigned",
    },
    assignedAt: { type: Date, default: Date.now },
    pickedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    collection: "deliveryAssignments",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

deliveryAssignmentSchema.index({ shipperId: 1, status: 1 });

const DeliveryAssignmentModel =
  mongoose.models.DeliveryAssignment ||
  mongoose.model("DeliveryAssignment", deliveryAssignmentSchema);

export default DeliveryAssignmentModel;
