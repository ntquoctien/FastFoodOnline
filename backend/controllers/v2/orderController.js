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
  if (error.message === "ORDER_NOT_FOUND") {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (error.message === "MISSION_NOT_FOUND") {
    return res.status(404).json({ success: false, message: "Mission not found" });
  }
  if (error.message === "DRONE_NOT_FOUND") {
    return res.status(404).json({ success: false, message: "Drone not found" });
  }
  if (error.message === "MISSING_MISSION_OR_DRONE") {
    return res.status(400).json({
      success: false,
      message: "Mission or drone missing for this order",
    });
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
    const { branchId, items, address, dropoffLat, dropoffLng, paymentMethod } =
      req.body;
    const userId = req.body.userId || req.userId;
    const result = await orderService.createOrder({
      userId,
      branchId,
      items,
      address,
      dropoffLat,
      dropoffLng,
      paymentMethod,
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

export const initializeStripePayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const result = await orderService.initializeStripePayment({
      orderId,
      amount,
    });
    res.json(result);
  } catch (error) {
    console.error("Order v2 init Stripe payment error", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to initialise Stripe payment" });
  }
};

export const verifyStripePayment = async (req, res) => {
  try {
    const sessionId = req.query.sessionId || req.query.session_id;
    const { orderId } = req.query;
    const result = await orderService.verifyStripePayment({
      sessionId,
      orderId,
    });
    res.json(result);
  } catch (error) {
    console.error("Order v2 verify Stripe error", error);
    res.status(500).json({ success: false, message: "Failed to verify Stripe payment" });
  }
};

export const initializeMomoPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const result = await orderService.initializeMomoPayment({
      orderId,
      amount,
    });
    res.json(result);
  } catch (error) {
    console.error("Order v2 init MoMo payment error", error);
    res.status(500).json({ success: false, message: "Failed to initialise MoMo payment" });
  }
};

export const verifyMomoPayment = async (req, res) => {
  try {
    const { orderId, requestId } = req.query;
    const result = await orderService.verifyMomoPayment({
      orderId,
      requestId,
    });
    res.json(result);
  } catch (error) {
    console.error("Order v2 verify MoMo error", error);
    res.status(500).json({ success: false, message: "Failed to verify MoMo payment" });
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

export const acceptOrder = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const actor = await getUser(userId);
    const orderId = req.params.id || req.params.orderId;
    const result = await orderService.acceptOrder(orderId, actor);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    handleCommonError(res, error, "Order v2 accept error");
  }
};

export const markOrderReadyToShip = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const actor = await getUser(userId);
    const orderId = req.params.id || req.params.orderId;
    const result = await orderService.markOrderReadyToShip(orderId, actor);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    handleCommonError(res, error, "Order v2 ready-to-ship error");
  }
};

export const confirmDelivery = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const actor = await getUser(userId);
    const orderId = req.params.id || req.params.orderId;
    const result = await orderService.confirmDelivery(orderId, actor);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    handleCommonError(res, error, "Order v2 confirm delivery error");
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

export const cancelOrder = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { orderId } = req.params;
    const { reason } = req.body || {};
    const result = await orderService.cancelOrder({
      orderId,
      userId,
      reason,
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    handleCommonError(res, error, "Order v2 cancel error");
  }
};

export const getOrderByIdV2 = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const actor = await getUser(userId);
    const { id } = req.params;
    const order = await orderService.getOrderByIdV2(id, actor);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.json({ success: true, data: order });
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return unauthorised(res);
    }
    if (error.message === "USER_NOT_FOUND") {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    console.error("Order v2 detail error", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load order" });
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
  initializeStripePayment,
  initializeMomoPayment,
  verifyVnpayPayment,
  verifyStripePayment,
  verifyMomoPayment,
  listUserOrders,
  listAllOrders,
  acceptOrder,
  markOrderReadyToShip,
  confirmDelivery,
  updateStatus,
  cancelOrder,
  confirmReceipt,
  getOrderByIdV2,
};
