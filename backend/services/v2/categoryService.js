import * as restaurantRepo from "../../repositories/v2/restaurantRepository.js";
import * as categoryRepo from "../../repositories/v2/categoryRepository.js";
import * as foodRepo from "../../repositories/v2/foodRepository.js";

const resolveRestaurant = async () =>
  (await restaurantRepo.findOne({ isActive: true })) ||
  (await restaurantRepo.findOne({}));

const normaliseCategory = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: plain._id,
    name: plain.name,
    description: plain.description || "",
    isActive: Boolean(plain.isActive),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const listCategories = async ({ includeInactive = false } = {}) => {
  const restaurant = await resolveRestaurant();
  if (!restaurant) {
    return { success: true, data: [] };
  }
  const filter = { restaurantId: restaurant._id };
  if (!includeInactive) {
    filter.isActive = true;
  }
  const categories = await categoryRepo
    .findAll(filter)
    .sort({ createdAt: 1 })
    .lean();

  return {
    success: true,
    data: categories.map(normaliseCategory),
  };
};

export const createCategory = async ({ name, description, isActive = true }) => {
  const restaurant = await resolveRestaurant();
  if (!restaurant) {
    return { success: false, message: "Restaurant not configured" };
  }
  const trimmedName = (name || "").trim();
  if (!trimmedName) {
    return { success: false, message: "Category name is required" };
  }

  const existing = await categoryRepo.findOne({
    restaurantId: restaurant._id,
    name: trimmedName,
  });
  if (existing) {
    return { success: false, message: "Category name already exists" };
  }

  const category = await categoryRepo.create({
    restaurantId: restaurant._id,
    name: trimmedName,
    description: (description || "").trim(),
    isActive: Boolean(isActive),
  });

  return { success: true, data: normaliseCategory(category) };
};

export const updateCategory = async ({
  categoryId,
  name,
  description,
  isActive,
}) => {
  if (!categoryId) {
    return { success: false, message: "Category id is required" };
  }
  const category = await categoryRepo.findById(categoryId);
  if (!category) {
    return { success: false, message: "Category not found" };
  }

  const update = {};
  if (name !== undefined) {
    const trimmedName = (name || "").trim();
    if (!trimmedName) {
      return { success: false, message: "Category name cannot be empty" };
    }
    if (trimmedName !== category.name) {
      const duplicate = await categoryRepo.findOne({
        restaurantId: category.restaurantId,
        name: trimmedName,
        _id: { $ne: category._id },
      });
      if (duplicate) {
        return { success: false, message: "Category name already exists" };
      }
      update.name = trimmedName;
    }
  }
  if (description !== undefined) {
    update.description = (description || "").trim();
  }
  if (isActive !== undefined) {
    update.isActive = Boolean(isActive);
  }

  if (Object.keys(update).length === 0) {
    return { success: false, message: "No changes to update" };
  }

  const updated = await categoryRepo.updateById(categoryId, update, {
    runValidators: true,
  });
  return { success: true, data: normaliseCategory(updated) };
};

export const deleteCategory = async ({ categoryId }) => {
  if (!categoryId) {
    return { success: false, message: "Category id is required" };
  }
  const category = await categoryRepo.findById(categoryId);
  if (!category) {
    return { success: false, message: "Category not found" };
  }

  const activeFoods = await foodRepo.count({
    categoryId: category._id,
    isActive: true,
  });
  if (activeFoods > 0) {
    return {
      success: false,
      message: "Cannot delete category while menu items are assigned to it",
    };
  }

  await categoryRepo.deleteById(categoryId);
  return { success: true };
};

export default {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
