import foodModel from "../models/foodModel.js";

export const createFood = (data) => {
  const food = new foodModel(data);
  return food.save();
};

export const findAll = () => foodModel.find({});

export const findById = (id) => foodModel.findById(id);

export const deleteById = (id) => foodModel.findByIdAndDelete(id);

export default { createFood, findAll, findById, deleteById };

