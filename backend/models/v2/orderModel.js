import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    foodVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodVariant",
      required: true,
    },
    title: { type: String, required: true },
    size: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const deliveryTimelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    actorType: { type: String, enum: ["user", "admin", "staff", "system", "drone"], default: "system" },
    at: { type: Date, default: Date.now },
    actor: { type: mongoose.Schema.Types.ObjectId },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    items: { type: [orderItemSchema], default: [] },
    address: {
      type: Object,
      required: true,
    },
    deliveryMethod: {
      type: String,
      enum: ["drone"],
      default: "drone",
    },
    pickupBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    pickupLat: { type: Number },
    pickupLng: { type: Number },
    dropoffAddress: { type: String },
    dropoffLat: { type: Number },
    dropoffLng: { type: Number },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    orderWeightKg: { type: Number },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "in_transit",
        "delivered",
        "cancelled",
        "delivery_failed",
      ],
      default: "pending",
    },
    cancellationReason: { type: String, maxlength: 500 },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    timeline: { type: [deliveryTimelineSchema], default: [] },
    needsDroneAssignment: { type: Boolean, default: false },
    lastDroneAssignAttemptAt: { type: Date },
    droneAssignRetries: { type: Number, default: 0 },
  },
  {
    collection: "orders",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default OrderModel;
