import mongoose from "mongoose";
import * as userRepo from "../../repositories/userRepository.js";
import * as orderRepo from "../../repositories/v2/orderRepository.js";

const toPlainObject = (doc) =>
  typeof doc?.toObject === "function" ? doc.toObject() : { ...doc };

const sanitizeCustomer = (doc) => {
  if (!doc) return null;
  const plain = toPlainObject(doc);
  return {
    _id: plain._id,
    name: plain.name,
    email: plain.email,
    phone: plain.phone || "",
    createdAt: plain.createdAt,
  };
};

const sanitizeOrder = (doc) => {
  if (!doc) return null;
  const plain = toPlainObject(doc);
  return {
    _id: plain._id,
    branch: plain.branchId?.name || undefined,
    branchId:
      plain.branchId?._id?.toString?.() ||
      (typeof plain.branchId === "string" ? plain.branchId : undefined),
    totalAmount: plain.totalAmount,
    status: plain.status,
    paymentStatus: plain.paymentStatus,
    createdAt: plain.createdAt,
    items: (plain.items || []).map((item) => ({
      title: item.title,
      size: item.size,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    })),
  };
};

const ensureAdmin = async (userId) => {
  if (!userId) {
    throw new Error("NOT_AUTHORISED");
  }
  const requester = await userRepo.findById(userId);
  if (!requester || requester.role !== "admin") {
    throw new Error("NOT_AUTHORISED");
  }
  return requester;
};

export const listCustomers = async ({ userId, search }) => {
  await ensureAdmin(userId);
  const filter = { role: "user" };
  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    const regex = new RegExp(trimmedSearch, "i");
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }
  const customers = await userRepo.findMany(filter, "-password", {
    sort: { createdAt: -1 },
    limit: 200,
  });
  return { success: true, data: customers.map(sanitizeCustomer) };
};

export const getCustomerOrders = async ({ userId, customerId }) => {
  await ensureAdmin(userId);
  if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
    return { success: false, message: "Invalid customer id" };
  }
  const orders = await orderRepo.find(
    { userId: customerId },
    { sort: { createdAt: -1 }, limit: 50 }
  );
  return {
    success: true,
    data: orders.map(sanitizeOrder),
  };
};

export default { listCustomers, getCustomerOrders };
