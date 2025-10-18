import * as inventoryRepo from "../../repositories/v2/inventoryRepository.js";
import * as userRepo from "../../repositories/userRepository.js";

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
  return { success: true, data: inventory };
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

  return { success: true, data: result };
};

export default { listInventory, updateInventory };
