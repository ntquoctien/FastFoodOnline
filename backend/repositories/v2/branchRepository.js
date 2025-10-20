import BranchModel from "../../models/v2/branchModel.js";

export const create = (payload) => BranchModel.create(payload);
export const findAll = (filter = {}) => BranchModel.find(filter);
export const findActive = (filter = {}) =>
  BranchModel.find({ ...filter, isActive: true });
export const findById = (id) => BranchModel.findById(id);
export const findOne = (filter = {}) => BranchModel.findOne(filter);
export const updateById = (id, payload, options = {}) =>
  BranchModel.findByIdAndUpdate(id, payload, { new: true, ...options });
export const updateMany = (filter = {}, payload = {}) =>
  BranchModel.updateMany(filter, payload);
export const deactivateById = (id) =>
  BranchModel.findByIdAndUpdate(id, { isActive: false }, { new: true });

export default {
  create,
  findAll,
  findActive,
  findById,
  findOne,
  updateById,
  updateMany,
  deactivateById,
};
