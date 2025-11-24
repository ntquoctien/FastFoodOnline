import * as orderRepo from "../repositories/v2/orderRepository.js";
import { assignDrone } from "../services/v2/orderService.js";

const DEFAULT_INTERVAL_MS =
  Number(process.env.DRONE_ASSIGN_CRON_MS || 5 * 60 * 1000) || 300000;
const MAX_BATCH = Number(process.env.DRONE_ASSIGN_CRON_BATCH || 20) || 20;

export const startDroneAssignRetry = () => {
  const interval = setInterval(async () => {
    try {
      const orders = await orderRepo.find(
        {
          needsDroneAssignment: true,
          status: "confirmed",
        },
        { limit: MAX_BATCH }
      );
      for (const order of orders) {
        // eslint-disable-next-line no-await-in-loop
        await assignDrone({ order });
      }
    } catch (error) {
      console.error("Drone assign retry failed", error);
    }
  }, DEFAULT_INTERVAL_MS);

  return interval;
};

export default { startDroneAssignRetry };
