import * as restaurantRepo from "../../repositories/v2/restaurantRepository.js";
import * as branchRepo from "../../repositories/v2/branchRepository.js";
import * as categoryRepo from "../../repositories/v2/categoryRepository.js";
import * as foodRepo from "../../repositories/v2/foodRepository.js";
import * as foodVariantRepo from "../../repositories/v2/foodVariantRepository.js";

export const getDefaultMenu = async ({ branchId } = {}) => {
  const restaurant =
    (await restaurantRepo.findOne({ isActive: true })) ||
    (await restaurantRepo.findOne({}));

  if (!restaurant) {
    return { success: true, data: { restaurant: null, categories: [], foods: [] } };
  }

  const [branches, categories, foods] = await Promise.all([
    branchRepo.findActive({ restaurantId: restaurant._id }),
    categoryRepo.findAll({ restaurantId: restaurant._id, isActive: true }),
    foodRepo.findAll({ isActive: true }).lean(),
  ]);

  const categoryMap = new Map(
    categories.map((cat) => [String(cat._id), { ...cat.toObject(), foods: [] }])
  );
  const branchMap = new Map(
    branches.map((branch) => [String(branch._id), branch.toObject()])
  );

  const foodIds = foods.map((food) => food._id);
  const variantFilter = { foodId: { $in: foodIds }, isActive: true };
  if (branchId) {
    variantFilter.branchId = branchId;
  }
  const variants = await foodVariantRepo.findAll(variantFilter).lean();

  const variantGroups = variants.reduce((acc, variant) => {
    const key = String(variant.foodId);
    if (!acc[key]) acc[key] = [];
    const branch = branchMap.get(String(variant.branchId));
    acc[key].push({
      ...variant,
      branchName: branch?.name || "Global",
    });
    return acc;
  }, {});

  const foodsWithVariants = foods
    .map((food) => {
      const variantsForFood = variantGroups[String(food._id)] || [];
      if (branchId && variantsForFood.length === 0) {
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

export const createCategory = async ({ name, description }) => {
  const restaurant =
    (await restaurantRepo.findOne({ isActive: true })) ||
    (await restaurantRepo.findOne({}));

  if (!restaurant) {
    return { success: false, message: "Restaurant not configured" };
  }

  const category = await categoryRepo.create({
    restaurantId: restaurant._id,
    name,
    description,
  });

  return { success: true, data: category };
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

export const archiveFood = async ({ foodId }) => {
  await foodRepo.updateById(foodId, { isActive: false });
  await foodVariantRepo.deactivateByFoodId(foodId);
  return { success: true };
};

export default {
  getDefaultMenu,
  createCategory,
  createFoodWithVariants,
  archiveFood,
};
