import ShipperProfileModel from "../../models/v2/shipperProfileModel.js";

export const create = (payload) => ShipperProfileModel.create(payload);
export const findAvailable = (filter = {}) =>
  ShipperProfileModel.find({ status: "available", ...filter }).sort({
    updatedAt: 1,
  });
export const updateById = (id, update) =>
  ShipperProfileModel.findByIdAndUpdate(id, update, { new: true });
export const findByUserId = (userId) =>
  ShipperProfileModel.findOne({ userId });
export const findAll = (filter = {}) =>
  ShipperProfileModel.find(filter)
    .populate("userId", "name email")
    .populate("branchId");

export default {
  create,
  findAvailable,
  updateById,
  findByUserId,
  findAll,
};
