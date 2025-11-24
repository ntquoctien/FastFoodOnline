import DroneAssignmentModel from "../../models/v2/droneAssignmentModel.js";

export const create = (payload) => DroneAssignmentModel.create(payload);

export const findByOrderId = (orderId) =>
  DroneAssignmentModel.findOne({ orderId })
    .populate("droneId")
    .populate({
      path: "orderId",
      populate: [{ path: "userId" }, { path: "branchId" }],
    });

export const updateByOrderId = (orderId, update) =>
  DroneAssignmentModel.findOneAndUpdate({ orderId }, update, {
    new: true,
  });

export const findById = (id) =>
  DroneAssignmentModel.findById(id)
    .populate("droneId")
    .populate({
      path: "orderId",
      populate: [{ path: "userId" }, { path: "branchId" }],
    });

export const findActiveByDroneId = (droneId) =>
  DroneAssignmentModel.findOne({
    droneId,
    status: { $nin: ["delivered", "cancelled", "failed"] },
  });

export default {
  create,
  findByOrderId,
  updateByOrderId,
  findById,
  findActiveByDroneId,
};
