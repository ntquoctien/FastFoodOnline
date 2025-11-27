import MissionModel from "../../models/v2/missionModel.js";

export const create = (payload) => MissionModel.create(payload);
export const findById = (id) => MissionModel.findById(id);
export const findOne = (filter = {}) => MissionModel.findOne(filter);
export const updateById = (id, payload, options = {}) =>
  MissionModel.findByIdAndUpdate(id, payload, { new: true, ...options });
export const findByOrderId = (orderId) => MissionModel.findOne({ orderId });

export default {
  create,
  findById,
  findOne,
  updateById,
  findByOrderId,
};

