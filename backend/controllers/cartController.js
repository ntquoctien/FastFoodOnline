import * as cartService from "../services/cartService.js";

// add items to user cart
const addToCart = async (req, res) => {
  try {
    const result = await cartService.addToCart({ userId: req.body.userId, itemId: req.body.itemId });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// remove from cart
const removeFromCart = async (req, res) => {
  try {
    const result = await cartService.removeFromCart({ userId: req.body.userId, itemId: req.body.itemId });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// fetch user cart data
const getCart = async (req, res) => {
  try {
    const result = await cartService.getCart({ userId: req.body.userId });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { addToCart, removeFromCart, getCart };
