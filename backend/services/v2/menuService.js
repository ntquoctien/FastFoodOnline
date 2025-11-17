import * as restaurantRepo from "../../repositories/v2/restaurantRepository.js";
import * as branchRepo from "../../repositories/v2/branchRepository.js";
import * as categoryRepo from "../../repositories/v2/categoryRepository.js";
import * as foodRepo from "../../repositories/v2/foodRepository.js";
import * as foodVariantRepo from "../../repositories/v2/foodVariantRepository.js";
import * as inventoryRepo from "../../repositories/v2/inventoryRepository.js";

const toPlainObject = (doc) =>
  doc && typeof doc.toObject === "function" ? doc.toObject() : doc;

const normaliseId = (value) =>
  value && typeof value.toString === "function" ? value.toString() : value ?? null;

const ensureVariantAccess = (context, variant) => {
  if (!context || context.role === "admin") {
    return;
  }
  const managerBranchId = normaliseId(context.branchId);
  const variantBranchId = normaliseId(variant.branchId);
  if (!managerBranchId || !variantBranchId || managerBranchId !== variantBranchId) {
    throw new Error("NOT_AUTHORISED");
  }
};

export const getDefaultMenu = async ({ branchId, includeInactive = false } = {}) => {
  const restaurant =
    (await restaurantRepo.findOne({ isActive: true })) ||
    (await restaurantRepo.findOne({}));

  if (!restaurant) {
    return { success: true, data: { restaurant: null, categories: [], foods: [] } };
  }

  const foodFilter = { isArchived: { $ne: true } };
  if (!includeInactive) {
    foodFilter.isActive = true;
  }

  const [branches, categories, foods] = await Promise.all([
    branchRepo.findActive({ restaurantId: restaurant._id }),
    categoryRepo.findAll({ restaurantId: restaurant._id, isActive: true }),
    foodRepo.findAll(foodFilter).lean(),
  ]);

  const categoryMap = new Map(
    categories.map((cat) => [String(cat._id), { ...cat.toObject(), foods: [] }])
  );
  const branchMap = new Map(
    branches.map((branch) => [String(branch._id), branch.toObject()])
  );

  const foodIds = foods.map((food) => food._id);
  const variantFilter = {
    foodId: { $in: foodIds },
    isArchived: { $ne: true },
  };
  if (!includeInactive) {
    variantFilter.isActive = true;
  }
  if (branchId) {
    variantFilter.branchId = branchId;
  }
  const variants = await foodVariantRepo.findAll(variantFilter).lean();

  const variantIds = variants.map((variant) => variant._id);
  const inventoryRecords = await inventoryRepo
    .findByVariantIds(variantIds)
    .lean();
  const inventoryMap = new Map(
    inventoryRecords.map((record) => [
      String(record.foodVariantId),
      record.quantity ?? 0,
    ])
  );

  const variantGroups = variants.reduce((acc, variant) => {
    const key = String(variant.foodId);
    if (!acc[key]) acc[key] = [];
    const branch = branchMap.get(String(variant.branchId));
    acc[key].push({
      ...variant,
      branchName: branch?.name || "Global",
      stockQuantity: inventoryMap.get(String(variant._id)) ?? 0,
    });
    return acc;
  }, {});

  const foodsWithVariants = foods
    .map((food) => {
      const variantsForFood = variantGroups[String(food._id)] || [];
      if (branchId && variantsForFood.length === 0 && !includeInactive) {
        return null;
      }
      return {
        ...food,
        variants: variantsForFood,
        categoryId: food.categoryId,
        categoryName: categoryMap.get(String(food.categoryId))?.name || "Unknown",
      };
    })
    .filter(Boolean);

  return {
    success: true,
    data: {
      restaurant,
      branches,
      categories: Array.from(categoryMap.values()),
      foods: foodsWithVariants,
    },
  };
};

export const createFoodWithVariants = async ({
  categoryId,
  name,
  description,
  imageUrl,
  variants,
}) => {
  if (!variants?.length) {
    return { success: false, message: "At least one variant is required" };
  }

  const food = await foodRepo.create({
    categoryId,
    name,
    description,
    imageUrl,
  });

  const payload = variants.map((variant, index) => ({
    ...variant,
    foodId: food._id,
    isDefault:
      index === 0 ? variant.isDefault ?? true : Boolean(variant.isDefault),
  }));

  const createdVariants = await foodVariantRepo.createMany(payload);

  return {
    success: true,
    data: {
      ...food.toObject(),
      variants: createdVariants,
    },
  };
};

export const updateFoodDetails = async ({
  foodId,
  name,
  description,
  categoryId,
  imageFilename,
}) => {
  const food = await foodRepo.findById(foodId);
  if (!food) {
    return { success: false, message: "Food not found" };
  }

  const update = {};

  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, message: "Food name cannot be empty" };
    }
    update.name = trimmed;
  }

  if (description !== undefined) {
    update.description = description.trim();
  }

  if (categoryId !== undefined) {
    update.categoryId = categoryId;
  }

  if (imageFilename) {
    update.imageUrl = imageFilename;
  }

  if (Object.keys(update).length === 0) {
    return { success: false, message: "No changes provided" };
  }

  const updated = await foodRepo.updateById(foodId, update, {
    runValidators: true,
  });

  return { success: true, data: updated };
};

export const archiveFood = async ({ foodId }) => {
  const food = await foodRepo.findById(foodId);
  if (!food) {
    return { success: false, message: "Food not found" };
  }
  await foodRepo.updateById(foodId, {
    isActive: false,
    isManuallyDisabled: true,
    isArchived: true,
  });
  await foodVariantRepo.updateMany(
    { foodId },
    { $set: { isActive: false, isManuallyDisabled: true, isArchived: true } }
  );
  return { success: true, data: toPlainObject(food) };
};

export const setFoodSaleStatus = async ({ foodId, isActive }) => {
  const food = await foodRepo.findById(foodId);
  if (!food) {
    return { success: false, message: "Food not found" };
  }
  const variants = await foodVariantRepo.findAll({ foodId }).lean();
  if (!variants.length) {
    await foodRepo.updateById(foodId, {
      isActive: Boolean(isActive),
      isManuallyDisabled: !isActive,
      isArchived: false,
    });
    const refreshed = await foodRepo.findById(foodId);
    return { success: true, data: { food: toPlainObject(refreshed) } };
  }

  if (!isActive) {
    await foodRepo.updateById(foodId, {
      isActive: false,
      isManuallyDisabled: true,
      isArchived: false,
    });
    await foodVariantRepo.updateMany(
      { foodId },
      { $set: { isActive: false, isManuallyDisabled: true, isArchived: false } }
    );
    const refreshed = await foodRepo.findById(foodId);
    return { success: true, data: { food: toPlainObject(refreshed) } };
  }

  const variantIds = variants.map((variant) => variant._id);
  const inventoryDocs = await inventoryRepo
    .findByVariantIds(variantIds)
    .lean();
  const inventoryMap = new Map(
    inventoryDocs.map((doc) => [
      String(doc.foodVariantId),
      Number(doc.quantity) || 0,
    ])
  );

  await foodRepo.updateById(foodId, {
    isActive: true,
    isManuallyDisabled: false,
    isArchived: false,
  });

  await Promise.all(
    variants.map((variant) => {
      const quantity = inventoryMap.get(String(variant._id)) ?? 0;
      return foodVariantRepo.updateById(variant._id, {
        isActive: quantity > 0,
        isManuallyDisabled: false,
        isArchived: false,
      });
    })
  );

  const refreshed = await foodRepo.findById(foodId);
  return { success: true, data: { food: toPlainObject(refreshed) } };
};

export const setVariantSaleStatus = async ({ variantId, isActive, context }) => {
  const variant = await foodVariantRepo.findById(variantId);
  if (!variant) {
    return { success: false, message: "Variant not found" };
  }
  ensureVariantAccess(context, variant);

  if (!isActive) {
    const updated = await foodVariantRepo.updateById(variantId, {
      isActive: false,
      isManuallyDisabled: true,
      isArchived: false,
    });
    return { success: true, data: { variant: toPlainObject(updated) } };
  }

  const inventoryDoc = await inventoryRepo.findOne({
    foodVariantId: variantId,
  });
  const quantity = Number(inventoryDoc?.quantity) || 0;

  const updated = await foodVariantRepo.updateById(variantId, {
    isActive: quantity > 0,
    isManuallyDisabled: false,
    isArchived: false,
  });

  return {
    success: true,
    data: { variant: toPlainObject(updated), quantity },
  };
};

export const updateVariantDetails = async ({ variantId, price, context }) => {
  const variant = await foodVariantRepo.findById(variantId);
  if (!variant) {
    return { success: false, message: "Variant not found" };
  }
  ensureVariantAccess(context, variant);
  const update = {};
  if (price !== undefined) {
    const parsed = Number(price);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { success: false, message: "Price must be a non-negative number" };
    }
    update.price = parsed;
  }
  if (Object.keys(update).length === 0) {
    return { success: false, message: "No changes requested" };
  }
  const updated = await foodVariantRepo.updateById(variantId, update);
  return { success: true, data: toPlainObject(updated) };
};

export const deleteVariant = async ({ variantId, context }) => {
  const variant = await foodVariantRepo.findById(variantId);
  if (!variant) {
    return { success: false, message: "Variant not found" };
  }
  ensureVariantAccess(context, variant);
  const deleted = await foodVariantRepo.deleteById(variantId);
  await inventoryRepo.deleteByVariantIds([variantId]);
  return { success: true, data: toPlainObject(deleted || variant) };
};

export default {
  getDefaultMenu,
  createFoodWithVariants,
  updateFoodDetails,
  archiveFood,
  setFoodSaleStatus,
  setVariantSaleStatus,
  updateVariantDetails,
  deleteVariant,
};

