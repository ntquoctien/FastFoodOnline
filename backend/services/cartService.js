import * as userRepo from "../repositories/userRepository.js";

export const incrementCartItem = (cartData, itemId) => {
  const next = { ...(cartData || {}) };
  next[itemId] = (next[itemId] || 0) + 1;
  return next;
};

export const addToCart = async ({ userId, itemId }) => {
  const user = await userRepo.findById(userId);
  const cartData = incrementCartItem(user.cartData, itemId);
  await userRepo.setCart(userId, cartData);
  return { success: true, message: "Added to Cart" };
};

export const removeFromCart = async ({ userId, itemId }) => {
  const user = await userRepo.findById(userId);
  const cartData = user.cartData || {};
  if ((cartData[itemId] || 0) > 1) {
    cartData[itemId] -= 1;
  } else {
    delete cartData[itemId];
  }
  await userRepo.setCart(userId, cartData);
  return { success: true, message: "Removed from Cart" };
};

export const getCart = async ({ userId }) => {
  const cartData = await userRepo.getCart(userId);
  return { success: true, cartData };
};

export default { addToCart, removeFromCart, getCart };
