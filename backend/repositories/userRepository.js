import userModel from "../models/userModel.js";

export const findById = (id) => userModel.findById(id);

export const findOneByEmail = (email) => userModel.findOne({ email });

export const findMany = (filter = {}, projection = null, options = {}) =>
  userModel.find(filter, projection, options);

export const findStaff = (filter = {}) =>
  userModel
    .find(filter)
    .select("-password")
    .populate("branchId", "name");

export const findStaffById = (id) =>
  userModel
    .findById(id)
    .select("-password")
    .populate("branchId", "name");

export const createUser = (data) => {
  const user = new userModel(data);
  return user.save();
};

export const updateById = (id, update) =>
  userModel.findByIdAndUpdate(id, update);

export const updateByIdAndReturn = (id, update) =>
  userModel.findByIdAndUpdate(id, update, { new: true });

export const updatePasswordById = (id, password) =>
  userModel.findByIdAndUpdate(id, { password });

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
  findMany,
  findStaff,
  findStaffById,
  createUser,
  updateById,
  updateByIdAndReturn,
  updatePasswordById,
  clearCart,
  getCart,
  setCart,
  getRole,
};
