import Stripe from "stripe";
import * as userRepo from "../repositories/userRepository.js";
import * as orderRepo from "../repositories/orderRepository.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const placeOrder = async ({ userId, items, amount, address }) => {
  const newOrder = await orderRepo.createOrder({ userId, items, amount, address });
  await userRepo.clearCart(userId);

  const line_items = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: { name: item.name },
      unit_amount: item.price * 100,
    },
    quantity: item.quantity,
  }));
  line_items.push({
    price_data: {
      currency: "usd",
      product_data: { name: "Delivery Charges" },
      unit_amount: 2 * 100,
    },
    quantity: 1,
  });

  const frontend_url = process.env.FRONTEND_URL || "https://food-delivery-frontend-s2l9.onrender.com";
  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: "payment",
    success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
    cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
  });

  return { success: true, session_url: session.url };
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

