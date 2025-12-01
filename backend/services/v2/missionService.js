import * as missionRepo from "../../repositories/v2/missionRepository.js";
import * as orderRepo from "../../repositories/v2/orderRepository.js";
import * as droneRepo from "../../repositories/v2/droneRepository.js";
const normaliseId = (value) =>
  value && typeof value.toString === "function" ? value.toString() : value;

export const completeDelivery = async ({ missionId }) => {
  const mission = await missionRepo.findById(missionId);
  if (!mission) {
    return { success: false, message: "Mission not found" };
  }

  const now = new Date();
  const updatedMission = await missionRepo.updateById(missionId, {
    status: "COMPLETED",
    finishedAt: now,
  });

  let updatedOrder = null;
  if (mission.orderId) {
    updatedOrder = await orderRepo.updateById(mission.orderId, {
      status: "DELIVERED",
      needsDroneAssignment: false,
    });
    await orderRepo.pushTimeline(mission.orderId, {
      status: "DELIVERED",
      actor: mission.droneId,
      actorType: "drone",
      at: now,
    });
  }

  if (mission.droneId) {
    // Simplified: mark drone available after delivery cycle
    await droneRepo.updateById(mission.droneId, { status: "AVAILABLE" });
  }

  return {
    success: true,
    data: {
      mission: updatedMission,
      order: updatedOrder,
    },
  };
};

export const markMissionArrived = async (missionId, actorUserOrSystem) => {
  if (!missionId) {
    const error = new Error("MISSION_NOT_FOUND");
    throw error;
  }
  const mission = await missionRepo.findById(missionId);
  if (!mission) {
    const error = new Error("MISSION_NOT_FOUND");
    throw error;
  }

  const order = mission.orderId ? await orderRepo.findById(mission.orderId) : null;
  if (!order) {
    const error = new Error("ORDER_NOT_FOUND");
    throw error;
  }

  // Optional branch permission check (respect branch restrictions)
  const actor = actorUserOrSystem || {};
  const isAdmin = ["admin", "super_admin"].includes(actor.role);
  if (!isAdmin) {
    const actorBranchId = normaliseId(actor.branchId);
    const orderBranchId = normaliseId(order.branchId?._id || order.branchId);
    if (!actorBranchId || actorBranchId !== orderBranchId) {
      const error = new Error("NOT_AUTHORISED");
      throw error;
    }
  }

  const now = new Date();

  const updatedMission = await missionRepo.updateById(mission._id, {
    status: "ARRIVED",
    startedAt: mission.startedAt || now,
  });

  await orderRepo.updateById(order._id, { status: "ARRIVED" });

  if (Array.isArray(order.timeline)) {
    await orderRepo.pushTimeline(order._id, {
      status: "ARRIVED",
      actorType: "system",
      actor: mission.droneId || null,
      at: now,
    });
  }

  // Optional: log for observability
  console.log(`Drone arrived for order ${order._id}`);

  const refreshedOrder = await orderRepo.findById(order._id);

  return {
    success: true,
    data: {
      mission: updatedMission,
      order: refreshedOrder,
    },
  };
};

export default { completeDelivery, markMissionArrived };
