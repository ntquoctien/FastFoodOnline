import BranchModel from "../../models/v2/branchModel.js";

export const create = (payload) => BranchModel.create(payload);
export const findAll = (filter = {}) => BranchModel.find(filter);
export const findById = (id) => BranchModel.findById(id);
export const findOne = (filter = {}) => BranchModel.findOne(filter);

export default { create, findAll, findById, findOne };
