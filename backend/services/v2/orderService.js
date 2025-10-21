import mongoose from "mongoose";
import * as orderRepo from "../../repositories/v2/orderRepository.js";
import * as paymentRepo from "../../repositories/v2/paymentRepository.js";
import * as foodVariantRepo from "../../repositories/v2/foodVariantRepository.js";
import * as shipperRepo from "../../repositories/v2/shipperRepository.js";
import * as deliveryRepo from "../../repositories/v2/deliveryAssignmentRepository.js";
import * as inventoryRepo from "../../repositories/v2/inventoryRepository.js";
import * as branchRepo from "../../repositories/v2/branchRepository.js";

const calculateItems = async (items) => {
  const variantIds = items.map((item) => new mongoose.Types.ObjectId(item.variantId));
  const variants = await foodVariantRepo
    .findAll({ _id: { $in: variantIds } })
    .populate("foodId");

  const variantMap = new Map(
    variants.map((variant) => [String(variant._id), variant])
  );

  let subtotal = 0;
  const normalizedItems = [];

  for (const item of items) {
    const variant = variantMap.get(item.variantId);
    if (!variant) {
      throw new Error(`Variant ${item.variantId} not found`);
    }
    const quantity = Number(item.quantity || 1);
    const itemTotal = variant.price * quantity;
    subtotal += itemTotal;
    normalizedItems.push({
      foodVariantId: variant._id,
      title: variant.foodId.name,
      size: variant.size,
      quantity,
      unitPrice: variant.price,
      totalPrice: itemTotal,
      notes: item.notes || "",
    });
  }
  return { subtotal, normalizedItems };
};

const assignDrone = async ({ order, branchId }) => {
  const available = await shipperRepo.findAvailable({
    vehicleType: "drone",
    ...(branchId ? { branchId } : {}),
  });

  if (!available.length) {
    return null;
  }

  const drone = available[0];
  await shipperRepo.updateById(drone._id, { status: "busy" });
  const assignment = await deliveryRepo.create({
    orderId: order._id,
    shipperId: drone._id,
    status: "assigned",
    assignedAt: new Date(),
  });

  await orderRepo.pushTimeline(order._id, {
    status: "assigned",
    actor: drone.userId,
  });

  return assignment;
};

export const createOrder = async ({ userId, branchId, items, address }) => {
  const branch = await branchRepo.findById(branchId);
  if (!branch) {
    return { success: false, message: "Branch not found" };
  }

  const { subtotal, normalizedItems } = await calculateItems(items);
  const deliveryFee = 2;
  const totalAmount = subtotal + deliveryFee;

  const order = await orderRepo.create({
    userId,
    branchId,
    items: normalizedItems,
    address,
    subtotal,
    deliveryFee,
    totalAmount,
    status: "pending",
    paymentStatus: "unpaid",
    timeline: [{ status: "pending", at: new Date(), actor: userId }],
  });

  for (const item of normalizedItems) {
    await inventoryRepo.adjustQuantity({
      branchId,
      foodVariantId: item.foodVariantId,
      delta: -item.quantity,
    });
  }

  return { success: true, data: order };
};

export const confirmPayment = async ({
  orderId,
  provider,
  transactionId,
  amount,
}) => {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    return { success: false, message: "Order not found" };
  }

  await paymentRepo.create({
    orderId,
    provider,
    transactionId,
    amount,
    status: "success",
    paidAt: new Date(),
  });

  await orderRepo.updateById(orderId, {
    paymentStatus: "paid",
    status: "confirmed",
  });

  await orderRepo.pushTimeline(orderId, {
    status: "confirmed",
    actor: order.userId,
  });

  const assignment = await assignDrone({ order, branchId: order.branchId });

  return {
    success: true,
    data: {
      orderId,
      assignment,
    },
  };
};

export const listUserOrders = async ({ userId }) => {
  const orders = await orderRepo.find(
    { userId },
    { sort: { createdAt: -1 } }
  );
  return { success: true, data: orders };
};

export const listAllOrders = async ({ role, branchId, queryBranchId }) => {
  const filter = {};
  if (role === "admin") {
    if (queryBranchId) {
      filter.branchId = queryBranchId;
    }
  } else if (branchId) {
    filter.branchId = branchId;
  } else {
    throw new Error("NOT_AUTHORISED");
  }

  const orders = await orderRepo.find(filter, { sort: { createdAt: -1 } });
  return { success: true, data: orders };
};

export const updateStatus = async ({ orderId, status, actorId, role, branchId }) => {
  const existing = await orderRepo.findById(orderId);
  if (!existing) {
    return { success: false, message: "Order not found" };
  }

  if (role !== "admin") {
    const existingBranchId = existing.branchId?._id || existing.branchId;
    if (!branchId || String(existingBranchId) !== String(branchId)) {
      throw new Error("NOT_AUTHORISED");
    }
  }

  const order = await orderRepo.updateById(orderId, { status });

  await orderRepo.pushTimeline(orderId, {
    status,
    actor: actorId || order.userId,
  });
  if (status === "delivered") {
    const assignment = await deliveryRepo.updateByOrderId(orderId, {
      status: "delivered",
      deliveredAt: new Date(),
    });
    if (assignment?.shipperId) {
      await shipperRepo.updateById(assignment.shipperId, {
        status: "available",
      });
    }
  } else if (status === "cancelled") {
    const assignment = await deliveryRepo.updateByOrderId(orderId, {
      status: "cancelled",
      cancelledAt: new Date(),
    });
    if (assignment?.shipperId) {
      await shipperRepo.updateById(assignment.shipperId, {
        status: "available",
      });
    }
  }
  return { success: true, data: order };
};

export const confirmReceipt = async ({ orderId, userId }) => {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    return { success: false, message: "Order not found" };
  }
  if (String(order.userId?._id || order.userId) !== String(userId)) {
    throw new Error("NOT_AUTHORISED");
  }
  if (order.status === "delivered") {
    return { success: true, data: order };
  }

  const confirmableStatuses = ["in_transit"];
  if (!confirmableStatuses.includes(order.status)) {
    return { success: false, message: "Order cannot be confirmed yet" };
  }

  return updateStatus({
    orderId,
    status: "delivered",
    actorId: userId,
    role: "admin",
  });
};

export const initializeStripePayment = async ({ orderId, amount }) => {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    return { success: false, message: "Order not found" };
  }
  if (order.paymentStatus === "paid") {
    return { success: false, message: "Order already paid" };
  }

  // Stubbed integration Ã¢â‚¬â€œ replace with Stripe PaymentIntent creation when keys are configured.
  const clientSecret = `demo_client_secret_${orderId}_${Date.now()}`;
  return {
    success: true,
    data: {
      clientSecret,
      amount: amount || order.totalAmount,
    },
  };
};

export default {
  createOrder,
  confirmPayment,
  listUserOrders,
  listAllOrders,
  updateStatus,
  initializeStripePayment,
  confirmReceipt,
};
