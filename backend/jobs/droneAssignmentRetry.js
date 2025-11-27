import * as orderRepo from "../repositories/v2/orderRepository.js";
import { assignDroneForOrder } from "../services/v2/droneAssignmentService.js";

const DEFAULT_INTERVAL_MS =
  Number(process.env.DRONE_ASSIGN_CRON_MS || 5 * 60 * 1000) || 300000;
const MAX_BATCH = Number(process.env.DRONE_ASSIGN_CRON_BATCH || 20) || 20;

export const startDroneAssignRetry = () => {
  const interval = setInterval(async () => {
    try {
      const orders = await orderRepo.find(
        {
          needsDroneAssignment: true,
          status: { $in: ["WAITING_FOR_DRONE", "CREATED", "confirmed"] },
        },
        { limit: MAX_BATCH }
      );
      for (const order of orders) {
        // eslint-disable-next-line no-await-in-loop
        await assignDroneForOrder(order);
      }
    } catch (error) {
      console.error("Drone assign retry failed", error);
    }
  }, DEFAULT_INTERVAL_MS);

  return interval;
};

export default { startDroneAssignRetry };
