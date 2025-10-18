import * as inventoryService from "../../services/v2/inventoryService.js";

const handleError = (res, error, fallback) => {
  if (error.message === "NOT_AUTHORISED") {
    return res
      .status(403)
      .json({ success: false, message: "You are not allowed to perform this action" });
  }
  if (error.message === "USER_NOT_FOUND") {
    return res.status(401).json({ success: false, message: "User not found" });
  }
  if (error.message === "BRANCH_REQUIRED") {
    return res.status(400).json({ success: false, message: "branchId is required" });
  }
  if (error.message === "INVALID_QUANTITY") {
    return res.status(400).json({ success: false, message: "Quantity must be a number" });
  }
  console.error(fallback, error);
  return res.status(500).json({ success: false, message: "Inventory action failed" });
};

export const listInventory = async (req, res) => {
  try {
    const result = await inventoryService.listInventory({
      userId: req.userId || req.body.userId,
      branchId: req.query.branchId,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Inventory list error");
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { branchId, foodVariantId, quantity } = req.body;
    const result = await inventoryService.updateInventory({
      userId: req.userId || req.body.userId,
      branchId,
      foodVariantId,
      quantity,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Inventory update error");
  }
};

export default { listInventory, updateInventory };
