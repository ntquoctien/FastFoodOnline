import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createOrder,
  confirmPayment,
  initializeVnpayPayment,
  initializeStripePayment,
  initializeMomoPayment,
  verifyVnpayPayment,
  verifyStripePayment,
  verifyMomoPayment,
  listUserOrders,
  listAllOrders,
  updateStatus,
  confirmReceipt,
  cancelOrder,
} from "../controllers/v2/orderController.js";

const orderV2Router = express.Router();

orderV2Router.post("/", authMiddleware, createOrder);
orderV2Router.get("/me", authMiddleware, listUserOrders);
orderV2Router.post("/confirm-payment", authMiddleware, confirmPayment);
orderV2Router.post("/pay/stripe", authMiddleware, initializeStripePayment);
orderV2Router.get("/pay/stripe/verify", verifyStripePayment);
orderV2Router.post("/pay/momo", authMiddleware, initializeMomoPayment);
orderV2Router.get("/pay/momo/verify", verifyMomoPayment);
orderV2Router.post("/pay/vnpay", authMiddleware, initializeVnpayPayment);
orderV2Router.get("/pay/vnpay/verify", verifyVnpayPayment);
orderV2Router.get("/", authMiddleware, listAllOrders);
orderV2Router.patch("/:orderId/cancel", authMiddleware, cancelOrder);
orderV2Router.patch("/:orderId/confirm-receipt", authMiddleware, confirmReceipt);
orderV2Router.patch("/:orderId/status", authMiddleware, updateStatus);

export default orderV2Router;
