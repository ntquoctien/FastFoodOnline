import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String },
    level: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
    },
    action: {
      type: String,
      enum: ["create", "update", "delete", "status", "other"],
      default: "other",
    },
    entityType: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    targetRoles: [{ type: String }],
    targetBranchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    actor: {
      userId: { type: Schema.Types.ObjectId, ref: "user" },
      name: String,
      role: String,
      branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    },
    metadata: { type: Schema.Types.Mixed },
    readBy: [{ type: Schema.Types.ObjectId, ref: "user" }],
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ targetRoles: 1, targetBranchId: 1 });

const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default NotificationModel;

