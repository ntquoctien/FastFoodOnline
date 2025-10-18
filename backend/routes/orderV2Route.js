import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createOrder,
  confirmPayment,
  initializeStripePayment,
  listUserOrders,
  listAllOrders,
  updateStatus,
} from "../controllers/v2/orderController.js";

const orderV2Router = express.Router();

orderV2Router.post("/", authMiddleware, createOrder);
orderV2Router.get("/me", authMiddleware, listUserOrders);
orderV2Router.post("/confirm-payment", authMiddleware, confirmPayment);
orderV2Router.post("/pay/stripe", authMiddleware, initializeStripePayment);
orderV2Router.get("/", authMiddleware, listAllOrders);
orderV2Router.patch("/:orderId/status", authMiddleware, updateStatus);

export default orderV2Router;
