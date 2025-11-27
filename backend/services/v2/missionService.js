import * as missionRepo from "../../repositories/v2/missionRepository.js";
import * as orderRepo from "../../repositories/v2/orderRepository.js";
import * as droneRepo from "../../repositories/v2/droneRepository.js";

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

export default { completeDelivery };
