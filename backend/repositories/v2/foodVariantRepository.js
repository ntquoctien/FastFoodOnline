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

export default {
  create,
  createMany,
  findAll,
  findById,
  updateById,
  deactivateByFoodId,
};
