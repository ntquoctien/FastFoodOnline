import mongoose from "mongoose";
import * as orderRepo from "../../repositories/v2/orderRepository.js";
import * as paymentRepo from "../../repositories/v2/paymentRepository.js";
import * as foodVariantRepo from "../../repositories/v2/foodVariantRepository.js";
import * as droneRepo from "../../repositories/v2/droneRepository.js";
import * as droneAssignmentRepo from "../../repositories/v2/droneAssignmentRepository.js";
import * as inventoryRepo from "../../repositories/v2/inventoryRepository.js";
import * as branchRepo from "../../repositories/v2/branchRepository.js";
import * as geocodeCacheRepo from "../../repositories/v2/geocodeCacheRepository.js";
import * as missionRepo from "../../repositories/v2/missionRepository.js";
import { assignDroneForOrder, assignNextWaitingOrderForHub } from "./droneAssignmentService.js";
import { createPaymentUrl, verifyReturnParams } from "../../utils/vnpay.js";
import {
  createCheckoutSession,
  retrieveCheckoutSession,
} from "../../utils/stripe.js";
import {
  createPayment as createMomoPayment,
  queryPaymentStatus as queryMomoPaymentStatus,
} from "../../utils/momo.js";
import { resolveAddress, buildFullAddress } from "../../utils/geocode.js";
import { createMission, cancelMission } from "../../utils/droneGateway.js";

const MAX_DRONE_ASSIGN_RETRIES =
  Number(process.env.DRONE_ASSIGN_MAX_RETRIES || 3) || 3;
const MIN_DRONE_BATTERY = Number(process.env.DRONE_MIN_BATTERY || 40) || 40;
const DEFAULT_DRONE_SPEED_KMH =
  Number(process.env.DRONE_DEFAULT_SPEED_KMH || 40) || 40;
const ETA_BUFFER_MINUTES = Number(process.env.DRONE_ETA_BUFFER_MIN || 5) || 5;

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
  (process.env.STRIPE_CURRENCY || "vnd").toLowerCase();

const PAYLOAD_SAFETY_FACTOR =
  Math.min(
    Math.max(Number(process.env.DRONE_PAYLOAD_SAFETY || 0.85), 0.5),
    1.0
  ) || 0.85;
const PACKAGING_ALLOWANCE_KG =
  Number(process.env.DRONE_PACKAGING_KG || 0.1) || 0;
const DEFAULT_ITEM_WEIGHT_KG =
  Number(process.env.DRONE_DEFAULT_ITEM_WEIGHT_KG || 0.3) || 0;

const isPaidStatus = (value) =>
  String(value || "").toUpperCase() === "PAID" ||
  String(value || "").toLowerCase() === "paid";

const parseCoordinate = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normaliseId = (value) =>
  value && typeof value.toString === "function" ? value.toString() : value;

const assertBranchPermission = (order, actorUser) => {
  if (["admin", "super_admin"].includes(actorUser?.role)) return;
  const actorBranchId = normaliseId(actorUser?.branchId);
  const orderBranchId = normaliseId(order.branchId?._id || order.branchId);
  if (!actorBranchId || actorBranchId !== orderBranchId) {
    const error = new Error("NOT_AUTHORISED");
    throw error;
  }
};

const getBranchCoordinates = (branch) => {
  const locCoords = branch?.location?.coordinates;
  const locLng = Array.isArray(locCoords) ? parseCoordinate(locCoords[0]) : null;
  const locLat = Array.isArray(locCoords) ? parseCoordinate(locCoords[1]) : null;
  const lat = Number.isFinite(locLat)
    ? locLat
    : parseCoordinate(branch?.latitude ?? branch?.lat);
  const lng = Number.isFinite(locLng)
    ? locLng
    : parseCoordinate(branch?.longitude ?? branch?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { lat: null, lng: null };
  }
  return { lat, lng };
};

const resolveDropoffCoordinates = async ({ address, dropoffLat, dropoffLng }) => {
  const lat = parseCoordinate(dropoffLat);
  const lng = parseCoordinate(dropoffLng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  const fullAddress = buildFullAddress(address);
  const addressKey = (fullAddress || "").trim().toLowerCase();
  if (!addressKey) {
    const error = new Error("DROP_OFF_LOCATION_REQUIRED");
    throw error;
  }

  const cached = await geocodeCacheRepo.findByAddressKey(addressKey);
  if (cached && Number.isFinite(cached.lat) && Number.isFinite(cached.lng)) {
    return { lat: cached.lat, lng: cached.lng, fullText: fullAddress };
  }

  const geocoded = await resolveAddress(fullAddress);
  if (
    geocoded &&
    Number.isFinite(geocoded.lat) &&
    Number.isFinite(geocoded.lng)
  ) {
    const resolved = {
      lat: Number(geocoded.lat),
      lng: Number(geocoded.lng),
      fullText: geocoded.fullText || fullAddress,
    };
    await geocodeCacheRepo.upsert({
      addressKey,
      lat: resolved.lat,
      lng: resolved.lng,
      provider: "maptiler",
    });
    return resolved;
  }
  const error = new Error("DROP_OFF_LOCATION_REQUIRED");
  throw error;
};

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
  let totalWeightKg = 0;

  for (const item of items) {
    const variantKey = String(item.variantId);
    const variant = variantMap.get(variantKey);
    if (!variant) {
      throw new Error(`Variant ${item.variantId} not found`);
    }
    const quantity = Number(item.quantity || 1);
    const itemTotal = variant.price * quantity;
    subtotal += itemTotal;
    // Weight: prefer explicit weightKg; fallback to unitValue; then default
    const variantWeight =
      Number(variant.weightKg) && Number.isFinite(Number(variant.weightKg))
        ? Number(variant.weightKg)
        : Number(variant.unitValue) && Number.isFinite(Number(variant.unitValue))
        ? Number(variant.unitValue)
        : DEFAULT_ITEM_WEIGHT_KG;
    const itemWeight = Math.max(variantWeight, 0) * quantity;
    totalWeightKg += itemWeight;
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
  const totalWithPackaging = totalWeightKg + PACKAGING_ALLOWANCE_KG;
  return { subtotal, normalizedItems, totalWeightKg: totalWithPackaging };
};

const haversineKm = (a, b) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad((b.lat || 0) - (a.lat || 0));
  const dLng = toRad((b.lng || 0) - (a.lng || 0));
  const lat1 = toRad(a.lat || 0);
  const lat2 = toRad(b.lat || 0);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    sinLng * sinLng * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const assignDrone = async ({ order, branchId }) => {
  const existing = await droneAssignmentRepo.findByOrderId(order._id);
  if (existing) {
    return existing;
  }

  const resolvedBranchId =
    branchId ||
    order.pickupBranchId ||
    order.branchId?._id ||
    order.branchId ||
    null;
  let resolvedHubId = order.hubId || order.branchId?.hubId || null;
  if (!resolvedHubId && resolvedBranchId) {
    const branch = await branchRepo.findById(resolvedBranchId);
    if (branch) {
      resolvedHubId = branch.hubId || resolvedHubId;
    }
  }
  const availableDrones = await droneRepo.findAvailable({
    hubId: resolvedHubId,
    minBattery: MIN_DRONE_BATTERY,
    minPayloadKg:
      (order.orderWeightKg || 0) * PAYLOAD_SAFETY_FACTOR,
    near: {
      lat: order.pickupLat,
      lng: order.pickupLng,
    },
  });

  if (!availableDrones.length) {
    await orderRepo.updateById(order._id, {
      needsDroneAssignment: true,
      lastDroneAssignAttemptAt: new Date(),
    });
    return null;
  }

  const pickupPoint = {
    lat: order.pickupLat,
    lng: order.pickupLng,
  };
  const scored = availableDrones.map((drone) => {
    const loc = Array.isArray(drone.location?.coordinates)
      ? { lng: drone.location.coordinates[0], lat: drone.location.coordinates[1] }
      : null;
    const dronePoint = loc || {
      lat: drone.lastKnownLat ?? order.pickupLat,
      lng: drone.lastKnownLng ?? order.pickupLng,
    };
    const distance = haversineKm(pickupPoint, dronePoint);
    return { drone, distance };
  });

  scored.sort((a, b) => a.distance - b.distance);
  const best = scored[0]?.drone;
  if (!best) {
    await orderRepo.updateById(order._id, {
      needsDroneAssignment: true,
      lastDroneAssignAttemptAt: new Date(),
    });
    return null;
  }

  await droneRepo.updateById(best._id, { status: "busy" });
  const now = new Date();
  const assignment = await droneAssignmentRepo.create({
    orderId: order._id,
    droneId: best._id,
    status: "assigned",
    assignedAt: now,
  });

  await orderRepo.updateById(order._id, {
    needsDroneAssignment: false,
    lastDroneAssignAttemptAt: now,
  });

  await orderRepo.pushTimeline(order._id, {
    status: "drone_assigned",
    actorType: "system",
    actor: best._id,
    at: now,
  });

  try {
    await createMission({
      assignmentId: assignment._id,
      droneId: best._id,
      pickup: { lat: order.pickupLat, lng: order.pickupLng },
      dropoff: { lat: order.dropoffLat, lng: order.dropoffLng },
    });
  } catch (gatewayError) {
    console.error("Drone mission create failed", gatewayError);
  }

  return assignment;
};

export const createOrder = async ({
  userId,
  branchId,
  items,
  address,
  dropoffLat,
  dropoffLng,
  paymentMethod,
}) => {
  const branch = await branchRepo.findById(branchId);
  if (!branch) {
    return { success: false, message: "Branch not found" };
  }
  const branchHubId = branch.hubId || null;
  if (!branchHubId) {
    console.warn("Branch hubId missing for order creation", { branchId });
  }

  const customerAddress =
    typeof address === "object"
      ? {
          street: address.street?.trim(),
          ward: address.ward?.trim(),
          district: address.district?.trim(),
          city: address.city?.trim(),
          country: address.country?.trim() || "Vietnam",
        }
      : {};
  customerAddress.fullText =
    (address?.fullText && String(address.fullText).trim()) ||
    buildFullAddress(customerAddress);

  let dropoffAddressValue = customerAddress.fullText || "";
  const { lat: pickupLat, lng: pickupLng } = getBranchCoordinates(branch);
  if (!Number.isFinite(pickupLat) || !Number.isFinite(pickupLng)) {
    console.warn("Branch missing pickup coordinates for order", { branchId });
  }

  let dropoff;
  try {
    dropoff = await resolveDropoffCoordinates({
      address: customerAddress,
      dropoffLat,
      dropoffLng,
    });
  } catch (error) {
    if (error.message === "DROP_OFF_LOCATION_REQUIRED") {
      return {
        success: false,
        message: "Drop-off location is required for drone delivery",
      };
    }
    throw error;
  }

  // If geocoder returned normalized full text, prefer it
  if (dropoff?.fullText) {
    customerAddress.fullText = dropoff.fullText;
    dropoffAddressValue = dropoff.fullText;
  }

  const customerLocation = {
    type: "Point",
    coordinates: [dropoff.lng, dropoff.lat],
  };

  const initialStatus =
    branchHubId && Number.isFinite(pickupLat) && Number.isFinite(pickupLng)
      ? "CREATED"
      : "WAITING_FOR_DRONE";

  const { subtotal, normalizedItems, totalWeightKg } = await calculateItems(items);
  const deliveryFee = 2;
  const totalAmount = subtotal + deliveryFee;
  const paymentMethodValue =
    typeof paymentMethod === "string"
      ? paymentMethod.toUpperCase()
      : "ONLINE";
  const initialPaymentStatus = paymentMethodValue === "COD" ? "PAID" : "PENDING";

  const order = await orderRepo.create({
    userId,
    branchId,
    hubId: branchHubId,
    pickupBranchId: branchId,
    pickupLat,
    pickupLng,
    dropoffAddress: dropoffAddressValue,
    dropoffLat: dropoff.lat,
    dropoffLng: dropoff.lng,
    customerAddress,
    customerLocation,
    deliveryMethod: "drone",
    items: normalizedItems,
    address: { ...customerAddress, lat: dropoff.lat, lng: dropoff.lng }, // legacy payload compatibility
    subtotal,
    deliveryFee,
    totalAmount,
    orderWeightKg: totalWeightKg || 0,
    payloadWeightKg: totalWeightKg || 0,
    paymentMethod: paymentMethodValue,
    paymentStatus: initialPaymentStatus,
    status: initialStatus,
    needsDroneAssignment: true,
    timeline: [
      {
        status: "CREATED",
        at: new Date(),
        actor: userId,
        actorType: "user",
      },
    ],
  });

  for (const item of normalizedItems) {
    await inventoryRepo.adjustQuantity({
      branchId,
      foodVariantId: item.foodVariantId,
      delta: -item.quantity,
    });
  }

  // try auto-assign a drone; do not block order creation on failure
  await assignDroneForOrder(order);
  const refreshedOrder = await orderRepo.findById(order._id);

  return { success: true, data: refreshedOrder || order };
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

  if (!provider) {
    return { success: false, message: "Payment provider is required" };
  }

  const isAlreadyPaid =
    String(order.paymentStatus || "").toUpperCase() === "PAID" ||
    String(order.paymentStatus || "").toLowerCase() === "paid";
  if (isAlreadyPaid) {
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

  const updatedOrder = await orderRepo.updateById(orderId, {
    paymentStatus: "PAID",
    status: order.droneId ? order.status : "WAITING_FOR_DRONE",
    needsDroneAssignment: order.droneId ? false : true,
  });

  await orderRepo.pushTimeline(orderId, {
    status: "PAID",
    actor: order.userId,
    actorType: "user",
    at: new Date(),
  });

  const orderForAssignment = updatedOrder || order;
  let assignment = null;
  try {
    assignment = await assignDroneForOrder(orderForAssignment);
  } catch (assignError) {
    console.error("assignDroneForOrder after payment failed", assignError);
  }
  if (!assignment) {
    await orderRepo.updateById(orderId, {
      status: orderForAssignment.droneId ? orderForAssignment.status : "WAITING_FOR_DRONE",
      needsDroneAssignment: orderForAssignment.droneId ? false : true,
    });
  }

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
    if (isPaidStatus(order.paymentStatus)) {
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
    if (isPaidStatus(order.paymentStatus)) {
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
    if (isPaidStatus(order.paymentStatus)) {
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

export const getOrderByIdV2 = async (orderId, actorUser) => {
  if (!orderId) return null;
  const order = await orderRepo
    .findById(orderId)
    .populate("hubId", "name")
    .lean();
  if (!order) return null;

  const isAdmin = ["admin", "super_admin"].includes(actorUser?.role);
  if (!isAdmin) {
    const actorBranchId = normaliseId(actorUser?.branchId);
    const orderBranchId = normaliseId(order.branchId?._id || order.branchId);
    if (!actorBranchId || actorBranchId !== orderBranchId) {
      const error = new Error("NOT_AUTHORISED");
      throw error;
    }
  }
  return order;
};

export const acceptOrder = async (orderId, actorUser) => {
  if (!orderId) {
    return { success: false, message: "Order id is required" };
  }
  const order = await orderRepo.findById(orderId);
  if (!order) {
    const error = new Error("ORDER_NOT_FOUND");
    throw error;
  }

  assertBranchPermission(order, actorUser);

  const allowedStatuses = ["ASSIGNED", "CREATED", "WAITING_FOR_DRONE"];
  const currentStatus = String(order.status || "").toUpperCase();
  if (!allowedStatuses.includes(currentStatus)) {
    return { success: false, message: "Order is not ready to be accepted" };
  }

  await orderRepo.updateById(orderId, { status: "PREPARING" });
  if (Array.isArray(order.timeline)) {
    await orderRepo.pushTimeline(orderId, {
      status: "PREPARING",
      actorType: "branch",
      actor: actorUser?._id || actorUser?.id || actorUser?.userId,
      at: new Date(),
    });
  }

  const refreshed = await orderRepo.findById(orderId);
  return { success: true, data: refreshed };
};

export const readyToShipOrder = async (orderId, actorUser) => {
  if (!orderId) {
    return { success: false, message: "Order id is required" };
  }
  const order = await orderRepo.findById(orderId);
  if (!order) {
    const error = new Error("ORDER_NOT_FOUND");
    throw error;
  }
  assertBranchPermission(order, actorUser);

  const status = String(order.status || "").toUpperCase();
  if (["DELIVERING", "ARRIVED", "COMPLETED"].includes(status)) {
    return { success: true, data: order };
  }
  const allowed = ["PREPARING", "ASSIGNED", "CREATED", "WAITING_FOR_DRONE"];
  if (!allowed.includes(status)) {
    return { success: false, message: "Order not ready for delivery" };
  }

  if (!order.missionId || !order.droneId) {
    const error = new Error("MISSING_MISSION_OR_DRONE");
    throw error;
  }

  const mission =
    (order.missionId && (await missionRepo.findById(order.missionId))) ||
    (await missionRepo.findByOrderId(order._id));
  if (!mission) {
    const error = new Error("MISSION_NOT_FOUND");
    throw error;
  }

  const drone = await droneRepo.findById(order.droneId);
  if (!drone) {
    const error = new Error("DRONE_NOT_FOUND");
    throw error;
  }

  const now = new Date();
  await missionRepo.updateById(mission._id, {
    status: "EN_ROUTE_DELIVERY",
    startedAt: mission.startedAt || now,
  });

  await droneRepo.updateById(drone._id, { status: "DELIVERING" });

  await orderRepo.updateById(orderId, { status: "DELIVERING" });
  await orderRepo.pushTimeline(orderId, {
    status: "DELIVERING",
    actor: actorUser?._id || actorUser?.id,
    actorType: actorUser?.role === "admin" ? "admin" : "staff",
    at: now,
  });

  const refreshed = await orderRepo.findById(orderId);
  return { success: true, data: refreshed };
};

export const markOrderReadyToShip = readyToShipOrder;

export const confirmDelivery = async (orderId, actorUser) => {
  if (!orderId) {
    const error = new Error("ORDER_NOT_FOUND");
    throw error;
  }
  const order = await orderRepo.findById(orderId);
  if (!order) {
    const error = new Error("ORDER_NOT_FOUND");
    throw error;
  }

  const status = String(order.status || "").toUpperCase();
  if (!["ARRIVED", "DELIVERING", "COMPLETED"].includes(status)) {
    return { success: false, message: "Order is not ready to be completed" };
  }
  if (status === "COMPLETED") {
    return { success: true, data: order };
  }

  const mission =
    (order.missionId && (await missionRepo.findById(order.missionId))) ||
    (await missionRepo.findByOrderId(order._id));
  const now = new Date();
  if (mission?._id) {
    await missionRepo.updateById(mission._id, {
      status: "COMPLETED",
      finishedAt: mission.finishedAt || now,
    });
    if (mission.droneId) {
      await droneRepo.updateById(mission.droneId, { status: "AVAILABLE" });
      try {
        await assignNextWaitingOrderForHub(
          order.hubId || mission.hubId || order.branchId?.hubId || null
        );
      } catch (assignErr) {
        console.error(
          "Failed to auto-assign next waiting order after delivery",
          assignErr
        );
      }
    }
  }

  await orderRepo.updateById(orderId, { status: "COMPLETED" });
  await orderRepo.pushTimeline(orderId, {
    status: "COMPLETED",
    actor: actorUser?._id || actorUser?.id,
    actorType: "user",
    at: now,
  });

  const refreshed = await orderRepo.findById(orderId);
  return { success: true, data: refreshed };
};

export const updateStatus = async ({
  orderId,
  status,
  actorId,
  role,
  branchId,
  cancellationReason,
  actorType,
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

  const allowedStatuses = [
    "pending",
    "confirmed",
    "preparing",
    "in_transit",
    "delivered",
    "cancelled",
    "delivery_failed",
  ];
  if (!allowedStatuses.includes(status)) {
    return { success: false, message: "Invalid status" };
  }

  const orderFlow = [
    "pending",
    "confirmed",
    "preparing",
    "in_transit",
    "delivered",
  ];
  const isAdmin = role === "admin";
  const currentIndex = orderFlow.indexOf(existing.status);
  const nextIndex = orderFlow.indexOf(status);
  const isForwardStep =
    currentIndex !== -1 &&
    nextIndex !== -1 &&
    (nextIndex === currentIndex || nextIndex === currentIndex + 1);
  const canCancel =
    status === "cancelled" &&
    ["pending", "confirmed", "preparing", "in_transit"].includes(existing.status);
  if (
    !isAdmin &&
    existing.deliveryMethod === "drone" &&
    !isForwardStep &&
    !canCancel
  ) {
    return { success: false, message: "Invalid status transition for drone delivery" };
  }

  const now = new Date();
  const updatePayload = { status };
  if (status === "cancelled") {
    updatePayload.cancelledAt = now;
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
    actorType:
      actorType ||
      (role === "admin" ? "admin" : role === "staff" ? "staff" : "system"),
    at: now,
  });

  const assignment = await droneAssignmentRepo.findByOrderId(orderId);
  if (status === "delivered") {
    if (assignment) {
      await droneAssignmentRepo.updateByOrderId(orderId, {
        status: "delivered",
        deliveredAt: now,
      });
      if (assignment.droneId) {
        await droneRepo.updateById(assignment.droneId._id || assignment.droneId, {
          status: "available",
        });
      }
    }
  } else if (status === "cancelled") {
    if (assignment && !["delivered", "cancelled", "failed"].includes(assignment.status)) {
      await droneAssignmentRepo.updateByOrderId(orderId, {
        status: "cancelled",
        cancelledAt: now,
      });
      try {
        await cancelMission({
          assignmentId: assignment._id,
          droneId: assignment.droneId?._id || assignment.droneId,
        });
      } catch (missionError) {
        console.error("Drone mission cancel failed", missionError);
      }
      if (assignment.droneId) {
        await droneRepo.updateById(assignment.droneId._id || assignment.droneId, {
          status: "available",
        });
      }
    }
    // Restock inventory if not already cancelled/delivered before
    if (!["cancelled", "delivered"].includes(existing.status)) {
      const branchToRestock = existing.branchId?._id || existing.branchId || branchId;
      for (const item of existing.items || []) {
        await inventoryRepo.adjustQuantity({
          branchId: branchToRestock,
          foodVariantId: item.foodVariantId,
          delta: Number(item.quantity || 0),
        });
      }
    }
  } else if (status === "in_transit") {
    if (assignment) {
      await droneAssignmentRepo.updateByOrderId(orderId, {
        status: "en_route_dropoff",
        enRouteDropoffAt: now,
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

  const statusUpper = String(order.status || "").toUpperCase();
  const cancellableStatuses = [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "WAITING_FOR_DRONE",
    "ASSIGNED",
    "CREATED",
  ];
  if (!cancellableStatuses.includes(statusUpper)) {
    return { success: false, message: "Order cannot be cancelled at this stage" };
  }

  return updateStatus({
    orderId,
    status: "cancelled",
    actorId: userId,
    role: "admin",
    actorType: "user",
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
    actorType: "user",
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
  getOrderByIdV2,
  acceptOrder,
  readyToShipOrder,
  markOrderReadyToShip,
  confirmDelivery,
  updateStatus,
  cancelOrder,
  confirmReceipt,
};


