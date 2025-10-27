import * as inventoryRepo from "../../repositories/v2/inventoryRepository.js";
import * as userRepo from "../../repositories/userRepository.js";
import * as foodVariantRepo from "../../repositories/v2/foodVariantRepository.js";
import * as foodRepo from "../../repositories/v2/foodRepository.js";

const ensurePermission = async ({ userId }) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  return user;
};

export const listInventory = async ({ userId, branchId: queryBranchId }) => {
  const user = await ensurePermission({ userId });
  let filter = {};
  if (user.role === "admin") {
    if (queryBranchId) {
      filter.branchId = queryBranchId;
    }
  } else if (user.branchId) {
    filter.branchId = user.branchId;
  } else {
    throw new Error("NOT_AUTHORISED");
  }

  const inventory = await inventoryRepo.findDetailed(filter);
  const filtered = inventory.filter((entry) => {
    const variant = entry.foodVariantId;
    const food = variant?.foodId;
    if (!variant || !food) return false;
    if (variant.isArchived) return false;
    if (food.isArchived) return false;
    return true;
  });
  return { success: true, data: filtered };
};

export const updateInventory = async ({
  userId,
  branchId: bodyBranchId,
  foodVariantId,
  quantity,
}) => {
  const user = await ensurePermission({ userId });
  let targetBranchId = bodyBranchId;

  if (user.role === "admin") {
    if (!targetBranchId) {
      throw new Error("BRANCH_REQUIRED");
    }
  } else if (user.branchId) {
    targetBranchId = user.branchId;
  } else {
    throw new Error("NOT_AUTHORISED");
  }

    if (!foodVariantId) {
    throw new Error("VARIANT_REQUIRED");
  }

  const qty = Number(quantity);
  if (Number.isNaN(qty)) {
    throw new Error("INVALID_QUANTITY");
  }

  const result = await inventoryRepo.upsert({
    branchId: targetBranchId,
    foodVariantId,
    quantity: qty,
  });

  const variant = await foodVariantRepo.findById(foodVariantId);
  if (variant) {
    const food = await foodRepo.findById(variant.foodId);
    const foodManuallyDisabled = Boolean(food?.isManuallyDisabled);
    if (!variant.isManuallyDisabled && !foodManuallyDisabled) {
      if (qty <= 0 && variant.isActive) {
        await foodVariantRepo.updateById(foodVariantId, { isActive: false });
      }
      if (qty > 0 && !variant.isActive) {
        await foodVariantRepo.updateById(foodVariantId, { isActive: true });
      }
    }
  }

  return { success: true, data: result };
};

export default { listInventory, updateInventory };
