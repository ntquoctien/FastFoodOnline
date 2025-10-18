import CategoryModel from "../../models/v2/categoryModel.js";

export const create = (payload) => CategoryModel.create(payload);
export const findAll = (filter = {}) => CategoryModel.find(filter);
export const findById = (id) => CategoryModel.findById(id);
export const findOne = (filter = {}) => CategoryModel.findOne(filter);

export default { create, findAll, findById, findOne };
