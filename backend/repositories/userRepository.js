import userModel from "../models/userModel.js";

export const findById = (id) => userModel.findById(id);

export const findOneByEmail = (email) => userModel.findOne({ email });

export const createUser = (data) => {
  const user = new userModel(data);
  return user.save();
};

export const updateById = (id, update) => userModel.findByIdAndUpdate(id, update);

export const clearCart = (id) => userModel.findByIdAndUpdate(id, { cartData: {} });

export const getCart = async (id) => {
  const user = await userModel.findById(id);
  return user?.cartData || {};
};

export const setCart = (id, cartData) => userModel.findByIdAndUpdate(id, { cartData });

export const getRole = async (id) => {
  const user = await userModel.findById(id);
  return user?.role;
};

export default {
  findById,
  findOneByEmail,
  createUser,
  updateById,
  clearCart,
  getCart,
  setCart,
  getRole,
};

