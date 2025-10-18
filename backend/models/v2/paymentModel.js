import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "momo", "zalopay", "cash", "card"],
      required: true,
    },
    transactionId: { type: String },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    paidAt: { type: Date },
    meta: { type: Object },
  },
  {
    collection: "payments",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

paymentSchema.index({ orderId: 1, provider: 1 }, { unique: true });

const PaymentModel = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default PaymentModel;
