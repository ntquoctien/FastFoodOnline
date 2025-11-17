import {
  getCustomerOrders,
  listCustomers,
} from "../../services/v2/customerService.js";

const handleError = (res, error, message) => {
  if (error.message === "NOT_AUTHORISED") {
    return res
      .status(403)
      .json({ success: false, message: "You are not allowed to perform this action" });
  }
  console.error(message, error);
  return res.status(500).json({ success: false, message });
};

export const getCustomers = async (req, res) => {
  try {
    const result = await listCustomers({
      userId: req.userId || req.body.userId,
      search: req.query.search,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to load customers");
  }
};

export const getCustomerOrderHistory = async (req, res) => {
  try {
    const result = await getCustomerOrders({
      userId: req.userId || req.body.userId,
      customerId: req.params.customerId,
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    handleError(res, error, "Failed to load customer orders");
  }
};

export default {
  getCustomers,
  getCustomerOrderHistory,
};

