import FoodModel from '../../models/v2/foodModel.js';

export const create = (payload) => FoodModel.create(payload);
export const findAll = (filter = {}) => FoodModel.find(filter);
export const findById = (id) => FoodModel.findById(id);
export const findOne = (filter = {}) => FoodModel.findOne(filter);
export const updateById = (id, update) =>
  FoodModel.findByIdAndUpdate(id, update, { new: true });

export default { create, findAll, findById, findOne, updateById };

