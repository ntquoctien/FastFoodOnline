import FoodVariantModel from "../../models/v2/foodVariantModel.js";

export const create = (payload) => FoodVariantModel.create(payload);
export const createMany = (payload) => FoodVariantModel.insertMany(payload);
export const findAll = (filter = {}, projection = null) =>
  FoodVariantModel.find(filter, projection);
export const findById = (id) => FoodVariantModel.findById(id);
export const updateById = (id, update) =>
  FoodVariantModel.findByIdAndUpdate(id, update, { new: true });
export const deactivateByFoodId = (foodId) =>
  FoodVariantModel.updateMany({ foodId }, { $set: { isActive: false } });
export const updateMany = (filter = {}, update = {}) =>
  FoodVariantModel.updateMany(filter, update);
export const findByIds = (ids = []) =>
  FoodVariantModel.find({ _id: { $in: ids } });
export const deleteById = (id) => FoodVariantModel.findByIdAndDelete(id);

export default {
  create,
  createMany,
  findAll,
  findById,
  updateById,
  deactivateByFoodId,
  updateMany,
  findByIds,
  deleteById,
};
