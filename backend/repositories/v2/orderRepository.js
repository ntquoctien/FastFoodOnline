import OrderModel from "../../models/v2/orderModel.js";

export const create = (payload) => OrderModel.create(payload);
export const findById = (id) =>
  OrderModel.findById(id)
    .populate("branchId")
    .populate("userId", "name email phone")
    .populate("items.foodVariantId");
export const updateById = (id, update, options = {}) =>
  OrderModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
    ...options,
  });
export const count = (filter = {}) => OrderModel.countDocuments(filter);
export const countByBranchId = (branchId) => count({ branchId });
export const pushTimeline = (id, entry) => {
  const payload = { ...entry };
  if (!payload.at) {
    payload.at = new Date();
  }
  if (!payload.actorType) {
    payload.actorType = "system";
  }
  return OrderModel.findByIdAndUpdate(
    id,
    { $push: { timeline: payload } },
    { new: true }
  );
};

export const find = (filter = {}, options = {}) =>
  OrderModel.find(filter, null, options)
    .populate("branchId")
    .populate("userId", "name email phone")
    .populate("items.foodVariantId");

export default {
  create,
  findById,
  updateById,
  count,
  countByBranchId,
  pushTimeline,
  find,
};
