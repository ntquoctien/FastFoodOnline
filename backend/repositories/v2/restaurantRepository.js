import RestaurantModel from "../../models/v2/restaurantModel.js";

export const create = (payload) => RestaurantModel.create(payload);
export const findAll = (filter = {}) => RestaurantModel.find(filter);
export const findById = (id) => RestaurantModel.findById(id);
export const findOne = (filter = {}) => RestaurantModel.findOne(filter);
export const updateById = (id, payload, options = {}) =>
  RestaurantModel.findByIdAndUpdate(id, payload, { new: true, ...options });
export const updateOne = (filter = {}, payload = {}, options = {}) =>
  RestaurantModel.findOneAndUpdate(filter, payload, { new: true, ...options });

export default {
  create,
  findAll,
  findById,
  findOne,
  updateById,
  updateOne,
};
