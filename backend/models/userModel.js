import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { type: String, default: "user" },
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    cartData: { type: Object, default: {} },
    staffStatus: {
      type: String,
      enum: ["active", "inactive", "on_leave"],
      default: "active",
    },
  },
  { minimize: false }
);

const userModel = mongoose.model.user || mongoose.model("user", userSchema);
export default userModel;
