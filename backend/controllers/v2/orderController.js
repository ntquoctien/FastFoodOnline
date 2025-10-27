import * as orderService from "../../services/v2/orderService.js";
import * as userRepo from "../../repositories/userRepository.js";

const getUser = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    const error = new Error("USER_NOT_FOUND");
    throw error;
  }
  return user;
};

const unauthorised = (res) =>
  res
    .status(403)
    .json({ success: false, message: "You are not allowed to perform this action" });

const handleCommonError = (res, error, fallback) => {
  if (error.message === "NOT_AUTHORISED") {
    return unauthorised(res);
  }
  if (error.message === "USER_NOT_FOUND") {
    return res.status(401).json({ success: false, message: "User not found" });
  }
  console.error(fallback, error);
  return res
    .status(500)
    .json({ success: false, message: "Order action failed" });
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "127.0.0.1"
  );
};

export const createOrder = async (req, res) => {
  try {
    const { branchId, items, address } = req.body;
    const userId = req.body.userId || req.userId;
    const result = await orderService.createOrder({
      userId,
      branchId,
      items,
      address,
    });
    res.json(result);
  } catch (error) {
    console.error("Order v2 create error", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { orderId, provider, transactionId, amount } = req.body;
    const result = await orderService.confirmPayment({
      orderId,
      provider,
      transactionId,
      amount,
    });
    res.json(result);
  } catch (error) {
    console.error("Order v2 confirm error", error);
    res.status(500).json({ success: false, message: "Failed to confirm payment" });
  }
};

export const initializeVnpayPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const ipAddress = getClientIp(req);
    const result = await orderService.initializeVnpayPayment({
      orderId,
      amount,
      ipAddress,
    });
    res.json(result);
  } catch (error) {
    console.error("Order v2 init payment error", error);
    res.status(500).json({ success: false, message: "Failed to initialise payment" });
  }
};

export const verifyVnpayPayment = async (req, res) => {
  try {
    const result = await orderService.verifyVnpayPayment(req.query);
    res.json(result);
  } catch (error) {
    console.error("Order v2 verify payment error", error);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};

export const listUserOrders = async (req, res) => {
  try {
    const userId = req.body.userId || req.userId;
    const result = await orderService.listUserOrders({ userId });
    res.json(result);
  } catch (error) {
    console.error("Order v2 list error", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

export const listAllOrders = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const user = await getUser(userId);
    const result = await orderService.listAllOrders({
      role: user.role,
      branchId: user.branchId,
      queryBranchId: req.query.branchId,
    });
    res.json(result);
  } catch (error) {
    handleCommonError(res, error, "Order v2 admin list error");
  }
};

export const updateStatus = async (req, res) => {
  try {
    const actorId = req.userId || req.body.userId;
    const user = await getUser(actorId);
    const { orderId } = req.params;
    const { status } = req.body;
    const result = await orderService.updateStatus({
      orderId,
      status,
      actorId,
      role: user.role,
      branchId: user.branchId,
    });
    res.json(result);
  } catch (error) {
    handleCommonError(res, error, "Order v2 update status error");
  }
};

export const confirmReceipt = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { orderId } = req.params;
    const result = await orderService.confirmReceipt({ orderId, userId });
    res.json(result);
  } catch (error) {
    handleCommonError(res, error, "Order v2 confirm receipt error");
  }
};

export default {
  createOrder,
  confirmPayment,
  initializeVnpayPayment,
  verifyVnpayPayment,
  listUserOrders,
  listAllOrders,
  updateStatus,
  confirmReceipt,
};
