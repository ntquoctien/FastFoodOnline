import HubModel from "../../models/v2/hubModel.js";

export const create = (payload) => HubModel.create(payload);
export const findById = (id) => HubModel.findById(id);
export const findOne = (filter = {}) => HubModel.findOne(filter);
export const findAll = (filter = {}) => HubModel.find(filter);
export const updateById = (id, payload, options = {}) =>
  HubModel.findByIdAndUpdate(id, payload, { new: true, ...options });
export const deleteById = (id) => HubModel.findByIdAndDelete(id);

export default { create, findById, findOne, findAll, updateById, deleteById };
