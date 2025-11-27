import mongoose from "mongoose";
import { addressSchema, locationSchema } from "./commonSchemas.js";

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
    hubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hub",
    },
    items: { type: [orderItemSchema], default: [] },

    // New structured address + GeoJSON for customer drop-off
    customerAddress: { type: addressSchema, default: {} },
    customerLocation: { type: locationSchema },

    // Legacy fields retained for backward compatibility
    address: { type: Object }, // LEGACY - use customerAddress/customerLocation instead
    dropoffAddress: { type: String },
    dropoffLat: { type: Number },
    dropoffLng: { type: Number },

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

    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    orderWeightKg: { type: Number },
    payloadWeightKg: { type: Number },

    status: {
      type: String,
      enum: [
        "CREATED",
        "ASSIGNED",
        "COMPLETED",
        "PREPARING",
        "PICKING_UP",
        "DELIVERING",
        "DELIVERED",
        "CANCELED",
        "WAITING_FOR_DRONE",
        // legacy statuses
        "pending",
        "confirmed",
        "preparing",
        "in_transit",
        "delivered",
        "cancelled",
        "delivery_failed",
      ],
      default: "CREATED",
    },
    cancellationReason: { type: String, maxlength: 500 },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE", "MOMO", "STRIPE", "VNPAY", "OTHER"],
      default: "ONLINE",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    timeline: { type: [deliveryTimelineSchema], default: [] },

    droneId: { type: mongoose.Schema.Types.ObjectId, ref: "Drone" },
    missionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mission" },
    etaMinutes: { type: Number },

    needsDroneAssignment: { type: Boolean, default: true },
    lastDroneAssignAttemptAt: { type: Date },
    droneAssignRetries: { type: Number, default: 0 },
  },
  {
    collection: "orders",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ customerLocation: "2dsphere" });

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default OrderModel;
