import InventoryModel from "../../models/v2/inventoryModel.js";

export const upsert = async ({ branchId, foodVariantId, quantity }) =>
  InventoryModel.findOneAndUpdate(
    { branchId, foodVariantId },
    { $set: { quantity, updatedAt: new Date() } },
    { upsert: true, new: true }
  );

export const adjustQuantity = async ({ branchId, foodVariantId, delta }) =>
  InventoryModel.findOneAndUpdate(
    { branchId, foodVariantId },
    { $inc: { quantity: delta }, $set: { updatedAt: new Date() } },
    { new: true, upsert: true }
  );

export const findAll = (filter = {}) => InventoryModel.find(filter);
export const findOne = (filter = {}) => InventoryModel.findOne(filter);
export const findDetailed = (filter = {}) =>
  InventoryModel.find(filter)
    .populate("branchId")
    .populate({
      path: "foodVariantId",
      match: { isActive: true },
      populate: { path: "foodId", model: "Food", match: { isActive: true } },
    });

export default { upsert, adjustQuantity, findAll, findOne, findDetailed };
