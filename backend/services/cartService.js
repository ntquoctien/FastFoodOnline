import * as userRepo from "../repositories/userRepository.js";

export const incrementCartItem = (cartData, itemId) => {
  const nextCart = { ...(cartData || {}) };
  const currentQty = nextCart[itemId] || 0;
  nextCart[itemId] = currentQty + 1;
  return nextCart;
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
  const currentQty = cartData[itemId] || 0;
  if (currentQty > 1) {
    cartData[itemId] = currentQty - 1;
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
