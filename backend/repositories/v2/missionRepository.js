import MissionModel from "../../models/v2/missionModel.js";

export const create = (payload) => MissionModel.create(payload);
export const findById = (id) => MissionModel.findById(id);
export const findOne = (filter = {}) => MissionModel.findOne(filter);
export const updateById = (id, payload, options = {}) =>
  MissionModel.findByIdAndUpdate(id, payload, { new: true, ...options });
export const findByOrderId = (orderId) => MissionModel.findOne({ orderId });
export const count = (filter = {}) => MissionModel.countDocuments(filter);
export const countActive = (filter = {}) =>
  MissionModel.countDocuments({
    ...filter,
    status: { $nin: ["COMPLETED", "CANCELED"] },
  });
export const countActiveByDroneId = (droneId) => countActive({ droneId });
export const countActiveByHubId = (hubId) => countActive({ hubId });

export default {
  create,
  findById,
  findOne,
  updateById,
  findByOrderId,
  count,
  countActive,
  countActiveByDroneId,
  countActiveByHubId,
};
