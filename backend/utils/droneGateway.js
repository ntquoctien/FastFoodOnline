// Stub gateway for drone missions. Replace with real integration when available.
export const createMission = async ({ assignmentId, droneId, pickup, dropoff }) => {
  console.info("DRONE_GATEWAY:createMission", {
    assignmentId,
    droneId,
    pickup,
    dropoff,
  });
  return { success: true };
};

export const cancelMission = async ({ assignmentId, droneId }) => {
  console.info("DRONE_GATEWAY:cancelMission", { assignmentId, droneId });
  return { success: true };
};

export default { createMission, cancelMission };
