import CategoryModel from "../../models/v2/categoryModel.js";

export const create = (payload) => CategoryModel.create(payload);
export const findAll = (filter = {}) => CategoryModel.find(filter);
export const findById = (id) => CategoryModel.findById(id);
export const findOne = (filter = {}) => CategoryModel.findOne(filter);
export const updateById = (id, update, options = {}) =>
  CategoryModel.findByIdAndUpdate(id, update, { new: true, ...options });
export const deleteById = (id) => CategoryModel.findByIdAndDelete(id);

export default {
  create,
  findAll,
  findById,
  findOne,
  updateById,
  deleteById,
};
