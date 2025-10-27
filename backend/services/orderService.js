import * as userRepo from "../repositories/userRepository.js";
import * as orderRepo from "../repositories/orderRepository.js";
import { createPaymentUrl } from "../utils/vnpay.js";

export const placeOrder = async ({ userId, items, amount, address, ipAddress }) => {
  const newOrder = await orderRepo.createOrder({ userId, items, amount, address });
  await userRepo.clearCart(userId);

  try {
    const { paymentUrl } = createPaymentUrl({
      orderId: String(newOrder._id),
      amount,
      orderInfo: `Payment for order ${newOrder._id}`,
      ipAddress,
    });
    return {
      success: true,
      payment_url: paymentUrl,
      session_url: paymentUrl,
      orderId: String(newOrder._id),
    };
  } catch (error) {
    if (error.message === "VNPAY_CONFIG_INCOMPLETE") {
      return { success: false, message: "VNPAY configuration missing" };
    }
    if (error.message === "VNPAY_INVALID_AMOUNT") {
      return { success: false, message: "Invalid payment amount" };
    }
    console.error("VNPAY place order error", error);
    return { success: false, message: "Unable to create VNPAY payment" };
  }
};

export const verifyOrder = async ({ orderId, success }) => {
  if (success == "true") {
    await orderRepo.updateById(orderId, { payment: true });
    return { success: true, message: "Paid" };
  } else {
    await orderRepo.deleteById(orderId);
    return { success: false, message: "Not Paid" };
  }
};

export const userOrders = async ({ userId }) => {
  const orders = await orderRepo.findByUserId(userId);
  return { success: true, data: orders };
};

export const listOrders = async ({ userId }) => {
  const role = await userRepo.getRole(userId);
  if (role !== "admin") {
    return { success: false, message: "You are not admin" };
  }
  const orders = await orderRepo.findAll();
  return { success: true, data: orders };
};

export const updateStatus = async ({ userId, orderId, status }) => {
  const role = await userRepo.getRole(userId);
  if (role !== "admin") {
    return { success: false, message: "You are not an admin" };
  }
  await orderRepo.updateById(orderId, { status });
  return { success: true, message: "Status Updated Successfully" };
};

export default { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };


