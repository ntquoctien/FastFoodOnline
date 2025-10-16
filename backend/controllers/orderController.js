import * as orderService from "../services/orderService.js";

// placing user order for frontend
const placeOrder = async (req, res) => {
  try {
    const result = await orderService.placeOrder({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    const result = await orderService.verifyOrder({ orderId, success });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// user orders for frontend
const userOrders = async (req, res) => {
  try {
    const result = await orderService.userOrders({ userId: req.body.userId });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Listing orders for admin pannel
const listOrders = async (req, res) => {
  try {
    const result = await orderService.listOrders({ userId: req.body.userId });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// api for updating status
const updateStatus = async (req, res) => {
  try {
    const result = await orderService.updateStatus({
      userId: req.body.userId,
      orderId: req.body.orderId,
      status: req.body.status,
    });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };
