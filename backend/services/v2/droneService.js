import mongoose from "mongoose";
import * as droneRepo from "../../repositories/v2/droneRepository.js";
import * as droneAssignmentRepo from "../../repositories/v2/droneAssignmentRepository.js";
import * as orderRepo from "../../repositories/v2/orderRepository.js";
import * as userRepo from "../../repositories/userRepository.js";
import * as branchRepo from "../../repositories/v2/branchRepository.js";
import { cancelMission, createMission } from "../../utils/droneGateway.js";
import { assignDrone } from "./orderService.js";

const MAX_DRONE_ASSIGN_RETRIES =
  Number(process.env.DRONE_ASSIGN_MAX_RETRIES || 3) || 3;

const ensureAdmin = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    const error = new Error("USER_NOT_FOUND");
    throw error;
  }
  if (user.role !== "admin") {
    const error = new Error("NOT_AUTHORISED");
    throw error;
  }
  return user;
};

export const listDrones = async ({ userId }) => {
  await ensureAdmin(userId);
  const drones = await droneRepo.findAll({});
  return { success: true, data: drones };
};

export const createDrone = async ({
  userId,
  code,
  branchId,
  maxPayloadKg,
  batteryLevel = 100,
  status = "available",
  lastKnownLat,
  lastKnownLng,
}) => {
  await ensureAdmin(userId);
  const trimmedCode = (code || "").trim();
  const payload = Number(maxPayloadKg);
  if (!Number.isFinite(payload) || payload <= 0) {
    throw new Error("INVALID_PAYLOAD");
  }
  const battery = Number(batteryLevel);
  if (!Number.isFinite(battery) || battery < 0 || battery > 100) {
    throw new Error("INVALID_BATTERY");
  }
  const allowedStatus = ["available", "busy", "offline", "maintenance"];
  if (!allowedStatus.includes(status)) {
    throw new Error("INVALID_STATUS");
  }
  if (!branchId || !mongoose.isValidObjectId(branchId)) {
    throw new Error("INVALID_BRANCH");
  }
  const branch = await branchRepo.findById(branchId);
  if (!branch) {
    throw new Error("BRANCH_NOT_FOUND");
  }

  let finalCode = trimmedCode;
  if (!finalCode) {
    const prefix = process.env.DRONE_CODE_PREFIX || "DRN";
    const branchSuffix = String(branch._id || branchId).slice(-4);
    finalCode = `${prefix}-${branchSuffix}-${Date.now().toString().slice(-5)}`;
  } else {
    const existingCode = await droneRepo.findAll({ code: finalCode });
    if (existingCode.length) {
      throw new Error("CODE_IN_USE");
    }
  }

  const drone = await droneRepo.create({
    code: finalCode,
    serialNumber: finalCode,
    branchId: branch._id,
    maxPayloadKg: payload,
    batteryLevel: battery,
    status,
    lastKnownLat: Number.isFinite(Number(lastKnownLat)) ? Number(lastKnownLat) : undefined,
    lastKnownLng: Number.isFinite(Number(lastKnownLng)) ? Number(lastKnownLng) : undefined,
  });

  return { success: true, data: drone };
};

export const updateDrone = async ({
  userId,
  droneId,
  code,
  branchId,
  status,
  batteryLevel,
  lastKnownLat,
  lastKnownLng,
  maxPayloadKg,
}) => {
  await ensureAdmin(userId);
  const update = {};
  if (status) {
    const allowed = ["available", "busy", "offline", "maintenance"];
    if (!allowed.includes(status)) {
      throw new Error("INVALID_STATUS");
    }
    update.status = status;
  }
  if (batteryLevel !== undefined) {
    const val = Number(batteryLevel);
    if (!Number.isFinite(val) || val < 0 || val > 100) {
      throw new Error("INVALID_BATTERY");
    }
    update.batteryLevel = val;
  }
  if (lastKnownLat !== undefined) {
    const val = Number(lastKnownLat);
    if (Number.isFinite(val)) {
      update.lastKnownLat = val;
    }
  }
  if (lastKnownLng !== undefined) {
    const val = Number(lastKnownLng);
    if (Number.isFinite(val)) {
      update.lastKnownLng = val;
    }
  }
  if (maxPayloadKg !== undefined) {
    const val = Number(maxPayloadKg);
    if (!Number.isFinite(val) || val <= 0) {
      throw new Error("INVALID_PAYLOAD");
    }
    update.maxPayloadKg = val;
  }
  if (branchId) {
    if (!mongoose.isValidObjectId(branchId)) {
      throw new Error("INVALID_BRANCH");
    }
    const branch = await branchRepo.findById(branchId);
    if (!branch) {
      throw new Error("BRANCH_NOT_FOUND");
    }
    update.branchId = branch._id;
  }
  if (code !== undefined) {
    const trimmedCode = (code || "").trim();
    if (!trimmedCode) {
      throw new Error("INVALID_CODE");
    }
    const existing = await droneRepo.findAll({ code: trimmedCode });
    if (existing.length && String(existing[0]._id) !== String(droneId)) {
      throw new Error("CODE_IN_USE");
    }
    update.code = trimmedCode;
    update.serialNumber = trimmedCode;
  }

  const updated = await droneRepo.updateById(droneId, update);
  if (!updated) {
    return { success: false, message: "Drone not found" };
  }
  return { success: true, data: updated };
};

export const deleteDrone = async ({ userId, droneId }) => {
  await ensureAdmin(userId);
  const drone = await droneRepo.findById(droneId);
  if (!drone) {
    return { success: false, message: "Drone not found" };
  }

  const activeAssignment = await droneAssignmentRepo.findActiveByDroneId(droneId);
  if (activeAssignment) {
    return {
      success: false,
      message: "Cannot delete drone with active assignment",
    };
  }

  await droneRepo.deleteById(droneId);
  return { success: true };
};

export const seedSampleDrones = async ({
  userId,
  branchId,
  count = 3,
  prefix = "DRN",
  maxPayloadKg,
}) => {
  await ensureAdmin(userId);
  const branch = await branchRepo.findById(branchId);
  if (!branch) {
    return { success: false, message: "Branch not found" };
  }
  const safeCount = Math.min(Math.max(Number(count) || 1, 1), 20);
  const payload = Number(maxPayloadKg);
  const effectivePayload = Number.isFinite(payload) && payload > 0 ? payload : 3;
  const created = [];
  for (let i = 0; i < safeCount; i += 1) {
    const code = `${prefix}-${String(branchId).slice(-4)}-${Date.now().toString().slice(-5)}-${i + 1}`;
    try {
      // eslint-disable-next-line no-await-in-loop
      const drone = await droneRepo.create({
        code,
        branchId: branch._id,
        status: "available",
        batteryLevel: 100,
        maxPayloadKg: effectivePayload,
      });
      created.push(drone);
    } catch (error) {
      if (error.code === 11000) {
        // retry with another code once
        const retryCode = `${prefix}-${String(branchId).slice(-4)}-${Date.now().toString().slice(-6)}-${Math.floor(
          Math.random() * 1000
        )}`;
        try {
          // eslint-disable-next-line no-await-in-loop
          const drone = await droneRepo.create({
            code: retryCode,
            branchId: branch._id,
            status: "available",
            batteryLevel: 100,
            maxPayloadKg: effectivePayload,
          });
          created.push(drone);
          continue;
        } catch (retryErr) {
          if (retryErr.code === 11000) {
            continue;
          }
          throw retryErr;
        }
      }
      throw error;
    }
  }
  if (!created.length) {
    return { success: false, message: "No drones created (duplicate codes)" };
  }
  return { success: true, data: created, message: "Seeded sample drones" };
};

const buildAssignmentUpdate = (status, now) => {
  const map = {
    assigned: { status: "assigned", assignedAt: now },
    en_route_pickup: { status: "en_route_pickup", enRoutePickupAt: now },
    at_pickup: { status: "at_pickup", pickedAt: now },
    en_route_dropoff: { status: "en_route_dropoff", enRouteDropoffAt: now },
    delivered: { status: "delivered", deliveredAt: now },
    cancelled: { status: "cancelled", cancelledAt: now },
    failed: { status: "failed", failedAt: now },
  };
  return map[status] || null;
};

const deriveOrderStatus = (current, incoming) => {
  if (incoming === "delivered") return "delivered";
  if (incoming === "en_route_dropoff") return "in_transit";
  if (incoming === "at_pickup" || incoming === "en_route_pickup") {
    if (current === "pending") return "confirmed";
    return current === "confirmed" ? "preparing" : current;
  }
  if (incoming === "cancelled") return current === "delivered" ? current : "cancelled";
  if (incoming === "failed") return "delivery_failed";
  return current;
};

export const handleDroneStatusEvent = async ({
  assignmentId,
  orderId,
  droneId,
  status,
  meta,
}) => {
  const now = new Date();
  const updatePayload = buildAssignmentUpdate(status, now);
  if (!updatePayload) {
    return { success: false, message: "Unsupported status" };
  }

  let assignment =
    (assignmentId && (await droneAssignmentRepo.findById(assignmentId))) ||
    (orderId && (await droneAssignmentRepo.findByOrderId(orderId)));

  if (!assignment) {
    return { success: false, message: "Assignment not found" };
  }

  // idempotent: if status already set and timestamp exists, return ok
  if (
    assignment.status === updatePayload.status &&
    Object.entries(updatePayload).every(([k, v]) => {
      if (k === "status") return true;
      return assignment[k];
    })
  ) {
    return { success: true, data: assignment };
  }

  const newMeta = {
    ...(assignment.meta || {}),
    ...(meta || {}),
  };

  assignment = await droneAssignmentRepo.updateByOrderId(assignment.orderId, {
    ...updatePayload,
    meta: newMeta,
  });

  const order = await orderRepo.findById(assignment.orderId);
  if (!order) {
    return { success: false, message: "Order not found for assignment" };
  }

  const nextOrderStatus = deriveOrderStatus(order.status, updatePayload.status);
  let updatedOrder = order;
  if (nextOrderStatus !== order.status) {
    updatedOrder = await orderRepo.updateById(order._id, {
      status: nextOrderStatus,
    });
    await orderRepo.pushTimeline(order._id, {
      status: nextOrderStatus,
      actor: assignment.droneId || droneId,
      actorType: "drone",
      at: now,
    });
  }

  const isTerminal =
    updatePayload.status === "delivered" ||
    updatePayload.status === "cancelled" ||
    updatePayload.status === "failed";
  if (isTerminal) {
    const resolvedDroneId = assignment.droneId?._id || assignment.droneId || droneId;
    if (resolvedDroneId) {
      await droneRepo.updateById(resolvedDroneId, { status: "available" });
    }
    if (updatePayload.status === "cancelled") {
      try {
        await cancelMission({
          assignmentId: assignment._id,
          droneId: resolvedDroneId,
        });
      } catch (cancelErr) {
        console.error("Drone mission cancel failed (webhook)", cancelErr);
      }
    }
  }

  if (updatePayload.status === "assigned") {
    try {
      await createMission({
        assignmentId: assignment._id,
        droneId: assignment.droneId || droneId,
        pickup: { lat: order.pickupLat, lng: order.pickupLng },
        dropoff: { lat: order.dropoffLat, lng: order.dropoffLng },
      });
    } catch (err) {
      console.error("Drone mission create failed (webhook)", err);
    }
  }

  if (
    (updatePayload.status === "failed" || updatePayload.status === "cancelled") &&
    order.status !== "cancelled"
  ) {
    const retries = Number(order.droneAssignRetries || 0);
    if (retries < MAX_DRONE_ASSIGN_RETRIES) {
      await orderRepo.updateById(order._id, {
        droneAssignRetries: retries + 1,
        needsDroneAssignment: true,
        lastDroneAssignAttemptAt: new Date(),
      });
      try {
        await assignDrone({ order });
      } catch (reassignErr) {
        console.error("Drone reassign failed", reassignErr);
      }
    } else {
      await orderRepo.updateById(order._id, {
        needsDroneAssignment: false,
        status: "delivery_failed",
      });
      await orderRepo.pushTimeline(order._id, {
        status: "delivery_failed",
        actor: assignment.droneId || droneId,
        actorType: "drone",
        at: new Date(),
      });
    }
  }

  return { success: true, data: { assignment, order: updatedOrder } };
};

export default {
  listDrones,
  createDrone,
  updateDrone,
  deleteDrone,
  seedSampleDrones,
  handleDroneStatusEvent,
};
