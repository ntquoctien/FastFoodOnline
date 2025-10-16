import orderModel from "../models/orderModel.js";

export const createOrder = (data) => {
  const order = new orderModel(data);
  return order.save();
};

export const updateById = (id, update) => orderModel.findByIdAndUpdate(id, update);

export const deleteById = (id) => orderModel.findByIdAndDelete(id);

export const findByUserId = (userId) => orderModel.find({ userId });

export const findAll = () => orderModel.find({});

export default { createOrder, updateById, deleteById, findByUserId, findAll };

