import OrderModel from "../../models/v2/orderModel.js";

export const create = (payload) => OrderModel.create(payload);
export const findById = (id) =>
  OrderModel.findById(id)
    .populate("branchId")
    .populate("userId", "name email phone")
    .populate("items.foodVariantId");
export const updateById = (id, update) =>
  OrderModel.findByIdAndUpdate(id, update, { new: true });
export const pushTimeline = (id, entry) =>
  OrderModel.findByIdAndUpdate(
    id,
    { $push: { timeline: entry } },
    { new: true }
  );

export const find = (filter = {}, options = {}) =>
  OrderModel.find(filter, null, options)
    .populate("branchId")
    .populate("items.foodVariantId");

export default { create, findById, updateById, pushTimeline, find };
