import mongoose from "mongoose";
import * as orderRepo from "../../repositories/v2/orderRepository.js";
import * as paymentRepo from "../../repositories/v2/paymentRepository.js";
import * as foodVariantRepo from "../../repositories/v2/foodVariantRepository.js";
import * as shipperRepo from "../../repositories/v2/shipperRepository.js";
import * as deliveryRepo from "../../repositories/v2/deliveryAssignmentRepository.js";
import * as inventoryRepo from "../../repositories/v2/inventoryRepository.js";
import * as branchRepo from "../../repositories/v2/branchRepository.js";
import { createPaymentUrl, verifyReturnParams } from "../../utils/vnpay.js";
import {
  createCheckoutSession,
  retrieveCheckoutSession,
} from "../../utils/stripe.js";
import {
  createPayment as createMomoPayment,
  queryPaymentStatus as queryMomoPaymentStatus,
} from "../../utils/momo.js";

const buildUrlWithParams = (base, params) => {
  if (!base) {
    return "";
  }
  const hasQuery = base.includes("?");
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");
  if (!query) {
    return base;
  }
  return `${base}${hasQuery ? "&" : "?"}${query}`;
};

const trimTrailingSlash = (value) => {
  if (!value) {
    return value;
  }
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const getFrontendBaseUrl = () => {
  const fromEnv = process.env.FRONTEND_BASE_URL;
  if (fromEnv) {
    return trimTrailingSlash(fromEnv);
  }
  return "http://localhost:5173";
};

const getStripeCurrency = () =>
  (process.env.STRIPE_CURRENCY || "usd").toLowerCase();

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
  meta,
  order: existingOrder,
}) => {
  const order = existingOrder || (await orderRepo.findById(orderId));
  if (!order) {
    return { success: false, message: "Order not found" };
  }

  if (order.paymentStatus === "paid") {
    return { success: true, message: "Order already paid" };
  }

  const existingPayment = await paymentRepo.findByOrderAndProvider(orderId, provider);
  const resolvedAmount = Number(
    amount ??
      existingPayment?.amount ??
      order.totalAmount
  );
  if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
    return { success: false, message: "Invalid payment amount" };
  }
  const fallbackTransaction =
    meta?.paymentIntentId || meta?.sessionId || meta?.transactionId;
  const resolvedTransactionId =
    transactionId ||
    existingPayment?.transactionId ||
    fallbackTransaction ||
    null;

  const paymentUpdate = {
    transactionId: resolvedTransactionId ? String(resolvedTransactionId) : null,
    amount: resolvedAmount,
    status: "success",
    paidAt: new Date(),
    meta: {
      ...(existingPayment?.meta || {}),
      ...(meta || {}),
    },
  };

  if (existingPayment) {
    await paymentRepo.updateByOrderAndProvider(orderId, provider, paymentUpdate);
  } else {
    await paymentRepo.create({
      orderId,
      provider,
      ...paymentUpdate,
    });
  }

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

export const initializeStripePayment = async ({ orderId, amount }) => {
  try {
    const order = await orderRepo.findById(orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }
    if (order.paymentStatus === "paid") {
      return { success: false, message: "Order already paid" };
    }

    const paymentAmount = Number(amount || order.totalAmount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return { success: false, message: "Invalid payment amount" };
    }

    const currency = getStripeCurrency();
    const successBase =
      process.env.STRIPE_SUCCESS_URL ||
      `${getFrontendBaseUrl()}/verify`;
    const cancelBase =
      process.env.STRIPE_CANCEL_URL ||
      `${getFrontendBaseUrl()}/order`;

    const successUrl = buildUrlWithParams(successBase, {
      provider: "stripe",
      orderId: String(orderId),
      session_id: "{CHECKOUT_SESSION_ID}",
    });
    const cancelUrl = buildUrlWithParams(cancelBase, {
      provider: "stripe",
      orderId: String(orderId),
      cancelled: "1",
    });

    const session = await createCheckoutSession({
      amount: paymentAmount,
      currency,
      successUrl,
      cancelUrl,
      customerEmail: order.address?.email,
      metadata: {
        orderId: String(orderId),
        orderName: `Order ${orderId}`,
      },
      description: `Payment for order ${orderId}`,
    });

    const existingPayment = await paymentRepo.findByOrderAndProvider(
      orderId,
      "stripe"
    );
    const paymentPayload = {
      transactionId: session.payment_intent
        ? String(session.payment_intent)
        : existingPayment?.transactionId || session.id,
      amount: paymentAmount,
      status: session.payment_status === "paid" ? "success" : "pending",
      meta: {
        ...(existingPayment?.meta || {}),
        sessionId: session.id,
        checkoutUrl: session.url,
        currency,
        paymentStatus: session.payment_status,
      },
    };
    if (session.payment_status === "paid") {
      paymentPayload.paidAt = new Date();
    }

    if (existingPayment) {
      await paymentRepo.updateByOrderAndProvider(
        orderId,
        "stripe",
        paymentPayload
      );
    } else {
      await paymentRepo.create({
        orderId,
        provider: "stripe",
        ...paymentPayload,
      });
    }

    if (session.payment_status === "paid") {
      return confirmPayment({
        orderId,
        provider: "stripe",
        transactionId: session.payment_intent || session.id,
        amount: paymentAmount,
        meta: paymentPayload.meta,
        order,
      });
    }

    return {
      success: true,
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
      },
    };
  } catch (error) {
    if (error.message === "STRIPE_CONFIG_INCOMPLETE") {
      return { success: false, message: "Stripe configuration missing" };
    }
    if (error.message === "STRIPE_INVALID_AMOUNT") {
      return { success: false, message: "Invalid payment amount" };
    }
    console.error("Stripe initialise error", error);
    return { success: false, message: "Failed to initialise Stripe payment" };
  }
};

export const verifyStripePayment = async ({ sessionId, orderId }) => {
  try {
    if (!sessionId) {
      return { success: false, message: "Missing Stripe session identifier" };
    }
    const session = await retrieveCheckoutSession(sessionId);
    if (!session) {
      return { success: false, message: "Stripe session not found" };
    }

    const derivedOrderId =
      orderId ||
      session.metadata?.orderId ||
      session.client_reference_id;
    if (!derivedOrderId) {
      return { success: false, message: "Unable to match session to order" };
    }

    const order = await orderRepo.findById(derivedOrderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }

    const existingPayment = await paymentRepo.findByOrderAndProvider(
      derivedOrderId,
      "stripe"
    );
    const rawAmountTotal = Number(session.amount_total ?? 0);
    const paymentAmount =
      rawAmountTotal > 0 ? rawAmountTotal / 100 : undefined;

    const paymentMeta = {
      ...(existingPayment?.meta || {}),
      sessionId: session.id,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
      checkoutUrl: existingPayment?.meta?.checkoutUrl || session.url,
    };
    const paymentPayload = {
      transactionId: session.payment_intent
        ? String(session.payment_intent)
        : existingPayment?.transactionId || session.id,
      amount:
        paymentAmount ??
        existingPayment?.amount ??
        order.totalAmount,
      status: session.payment_status === "paid" ? "success" : "pending",
      meta: paymentMeta,
    };
    if (session.payment_status === "paid") {
      paymentPayload.paidAt = new Date();
    }

    if (existingPayment) {
      await paymentRepo.updateByOrderAndProvider(
        derivedOrderId,
        "stripe",
        paymentPayload
      );
    } else {
      await paymentRepo.create({
        orderId: derivedOrderId,
        provider: "stripe",
        ...paymentPayload,
      });
    }

    if (session.payment_status !== "paid") {
      return {
        success: false,
        message: "Stripe payment not completed",
        data: {
          orderId: derivedOrderId,
          paymentStatus: session.payment_status,
        },
      };
    }

    const confirmResult = await confirmPayment({
      orderId: derivedOrderId,
      provider: "stripe",
      transactionId: session.payment_intent || session.id,
      amount: paymentAmount,
      meta: {
        ...paymentMeta,
        paymentIntentStatus: session.payment_status,
      },
      order,
    });

    return {
      ...confirmResult,
      data: {
        ...(confirmResult.data || {}),
        orderId: derivedOrderId,
        paymentStatus: session.payment_status,
      },
    };
  } catch (error) {
    if (error.message === "STRIPE_CONFIG_INCOMPLETE") {
      return { success: false, message: "Stripe configuration missing" };
    }
    console.error("Stripe verify error", error);
    return { success: false, message: "Failed to verify Stripe payment" };
  }
};

export const initializeMomoPayment = async ({ orderId, amount }) => {
  try {
    const order = await orderRepo.findById(orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }
    if (order.paymentStatus === "paid") {
      return { success: false, message: "Order already paid" };
    }

    const paymentAmount = Number(amount || order.totalAmount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return { success: false, message: "Invalid payment amount" };
    }

    const redirectBase =
      process.env.MOMO_REDIRECT_URL ||
      `${getFrontendBaseUrl()}/verify`;
    const redirectUrl = buildUrlWithParams(redirectBase, {
      provider: "momo",
      orderId: String(orderId),
    });

    const momoInit = await createMomoPayment({
      orderId: String(orderId),
      amount: paymentAmount,
      orderInfo: `Payment for order ${orderId}`,
      redirectUrl,
      ipnUrl: process.env.MOMO_IPN_URL,
    });

    const { data } = momoInit;
    const existingPayment = await paymentRepo.findByOrderAndProvider(
      orderId,
      "momo"
    );

    const paymentMeta = {
      ...(existingPayment?.meta || {}),
      requestId: momoInit.requestId,
      payUrl: data.payUrl,
      deeplink: data.deeplink,
      qrCodeUrl: data.qrCodeUrl,
      signature: data.signature,
      message: data.message,
      resultCode: data.resultCode,
    };

    const paymentPayload = {
      transactionId: existingPayment?.transactionId || null,
      amount: paymentAmount,
      status: "pending",
      meta: paymentMeta,
    };

    if (existingPayment) {
      await paymentRepo.updateByOrderAndProvider(
        orderId,
        "momo",
        paymentPayload
      );
    } else {
      await paymentRepo.create({
        orderId,
        provider: "momo",
        ...paymentPayload,
      });
    }

    if (Number(data.resultCode) !== 0 || !data.payUrl) {
      return {
        success: false,
        message: data.message || "Failed to initialise MoMo payment",
        data,
      };
    }

    return {
      success: true,
      data: {
        payUrl: data.payUrl,
        deeplink: data.deeplink,
        qrCodeUrl: data.qrCodeUrl,
        requestId: momoInit.requestId,
      },
    };
  } catch (error) {
    if (error.message === "MOMO_CONFIG_INCOMPLETE") {
      return { success: false, message: "MoMo configuration missing" };
    }
    if (error.message === "MOMO_INVALID_AMOUNT") {
      return { success: false, message: "Invalid payment amount" };
    }
    console.error("MoMo initialise error", error);
    return { success: false, message: "Failed to initialise MoMo payment" };
  }
};

export const verifyMomoPayment = async ({ orderId, requestId }) => {
  try {
    if (!orderId) {
      return { success: false, message: "Missing order identifier" };
    }
    const order = await orderRepo.findById(orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }
    const paymentRecord = await paymentRepo.findByOrderAndProvider(
      orderId,
      "momo"
    );
    if (!paymentRecord) {
      return { success: false, message: "MoMo payment not initialised" };
    }

    const effectiveRequestId =
      requestId || paymentRecord.meta?.requestId;
    if (!effectiveRequestId) {
      return { success: false, message: "MoMo request not found" };
    }

    const queryResult = await queryMomoPaymentStatus({
      orderId: String(orderId),
      requestId: effectiveRequestId,
    });

    const resultCode = Number(queryResult.resultCode);
    const paymentMeta = {
      ...(paymentRecord.meta || {}),
      queryResult,
    };

    if (resultCode !== 0) {
      await paymentRepo.updateByOrderAndProvider(orderId, "momo", {
        status: "failed",
        meta: paymentMeta,
      });
      return {
        success: false,
        message: queryResult.message || "MoMo payment not completed",
        data: {
          orderId,
          resultCode,
        },
      };
    }

    const transactionId =
      queryResult.transId ||
      queryResult.requestId ||
      paymentRecord.transactionId;
    const amount =
      Number(queryResult.amount || paymentRecord.amount) || order.totalAmount;

    const confirmResult = await confirmPayment({
      orderId,
      provider: "momo",
      transactionId,
      amount,
      meta: paymentMeta,
      order,
    });

    return {
      ...confirmResult,
      data: {
        ...(confirmResult.data || {}),
        orderId,
        resultCode,
        transId: queryResult.transId,
      },
    };
  } catch (error) {
    if (error.message === "MOMO_CONFIG_INCOMPLETE") {
      return { success: false, message: "MoMo configuration missing" };
    }
    console.error("MoMo verify error", error);
    return { success: false, message: "Failed to verify MoMo payment" };
  }
};

export const initializeVnpayPayment = async ({ orderId, amount, ipAddress }) => {
  try {
    const order = await orderRepo.findById(orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }
    if (order.paymentStatus === "paid") {
      return { success: false, message: "Order already paid" };
    }

    const paymentAmount = Number(amount || order.totalAmount);
    const { paymentUrl, params } = createPaymentUrl({
      orderId: String(orderId),
      amount: paymentAmount,
      orderInfo: `Payment for order ${orderId}`,
      ipAddress,
    });

    return {
      success: true,
      data: {
        paymentUrl,
        amount: paymentAmount,
        txnRef: params.vnp_TxnRef,
      },
    };
  } catch (error) {
    if (error.message === "VNPAY_CONFIG_INCOMPLETE") {
      return { success: false, message: "VNPAY configuration missing" };
    }
    if (error.message === "VNPAY_INVALID_AMOUNT") {
      return { success: false, message: "Invalid payment amount" };
    }
    console.error("VNPAY initialise error", error);
    return { success: false, message: "Failed to initialise VNPAY payment" };
  }
};

export const verifyVnpayPayment = async (query) => {
  try {
    const verification = verifyReturnParams(query);
    if (!verification.isValid) {
      return {
        success: false,
        message: verification.message || "Invalid VNPAY signature",
        data: { responseCode: query?.vnp_ResponseCode },
      };
    }

    const params = verification.data;
    const orderId = params.vnp_TxnRef;
    const responseCode = params.vnp_ResponseCode;
    const amount = Number(params.vnp_Amount || 0) / 100;
    const order = await orderRepo.findById(orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }

    if (responseCode !== "00") {
      return {
        success: false,
        message: "Payment was not successful",
        data: {
          orderId,
          responseCode,
        },
      };
    }

    const transactionId = params.vnp_TransactionNo || params.vnp_TxnRef;
    const confirmResult = await confirmPayment({
      orderId,
      provider: "vnpay",
      transactionId,
      amount,
      meta: {
        vnp_ResponseCode: responseCode,
        vnp_TransactionNo: params.vnp_TransactionNo,
        vnp_BankCode: params.vnp_BankCode,
        vnp_CardType: params.vnp_CardType,
        vnp_PayDate: params.vnp_PayDate,
      },
      order,
    });

    return {
      ...confirmResult,
      data: {
        ...(confirmResult.data || {}),
        orderId,
        responseCode,
      },
    };
  } catch (error) {
    if (error.message === "VNPAY_CONFIG_INCOMPLETE") {
      return { success: false, message: "VNPAY configuration missing" };
    }
    console.error("VNPAY verify error", error);
    return { success: false, message: "Failed to verify VNPAY payment" };
  }
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

export const updateStatus = async ({
  orderId,
  status,
  actorId,
  role,
  branchId,
  cancellationReason,
}) => {
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

  const updatePayload = { status };
  if (status === "cancelled") {
    updatePayload.cancelledAt = new Date();
    updatePayload.cancelledBy = actorId || existing.userId;
    if (typeof cancellationReason === "string") {
      const trimmed = cancellationReason.trim();
      if (trimmed) {
        updatePayload.cancellationReason = trimmed.slice(0, 500);
      } else {
        updatePayload.cancellationReason = "";
      }
    } else if (!existing.cancellationReason) {
      updatePayload.cancellationReason = "";
    }
  }

  const order = await orderRepo.updateById(orderId, updatePayload);

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

export const cancelOrder = async ({ orderId, userId, reason }) => {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    return { success: false, message: "Order not found" };
  }
  const ownerId = order.userId?._id || order.userId;
  if (!userId || String(ownerId) !== String(userId)) {
    throw new Error("NOT_AUTHORISED");
  }

  const cancellableStatuses = ["pending", "confirmed", "preparing"];
  if (!cancellableStatuses.includes(order.status)) {
    return { success: false, message: "Order cannot be cancelled at this stage" };
  }

  return updateStatus({
    orderId,
    status: "cancelled",
    actorId: userId,
    role: "admin",
    cancellationReason: reason,
  });
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

export default {
  createOrder,
  confirmPayment,
  initializeStripePayment,
  verifyStripePayment,
  initializeMomoPayment,
  verifyMomoPayment,
  initializeVnpayPayment,
  verifyVnpayPayment,
  listUserOrders,
  listAllOrders,
  updateStatus,
  cancelOrder,
  confirmReceipt,
};


