import * as menuService from "../../services/v2/menuService.js";
import * as userRepo from "../../repositories/userRepository.js";
import * as categoryService from "../../services/v2/categoryService.js";

const BRANCH_MANAGER_ROLES = ["manager", "branch_manager"];

const ensureAdmin = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user || user.role !== "admin") {
    throw new Error("NOT_AUTHORISED");
  }
};

const ensureMenuManager = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new Error("NOT_AUTHORISED");
  }
  if (user.role === "admin") {
    return { role: "admin" };
  }
  if (["manager", "branch_manager"].includes(user.role) && user.branchId) {
    return { role: "branch_manager", branchId: user.branchId };
  }
  throw new Error("NOT_AUTHORISED");
};

const handleUnauthorised = (res) =>
  res
    .status(403)
    .json({ success: false, message: "You are not allowed to perform this action" });

export const getDefaultMenu = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const result = await menuService.getDefaultMenu({
      branchId: req.query.branchId,
      includeInactive,
    });
    res.json(result);
  } catch (error) {
    console.error("Menu v2 error", error);
    res.status(500).json({ success: false, message: "Failed to load menu" });
  }
};

export const createCategory = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const { name, description } = req.body;
    const result = await categoryService.createCategory({ name, description });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Create category error", error);
    res
      .status(500)
      .json({ success: false, message: "Could not create category" });
  }
};

export const createFood = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const { name, description, categoryId } = req.body;
    let variants = [];
    if (req.body.variants) {
      try {
        variants = JSON.parse(req.body.variants);
      } catch (parseError) {
        return res.json({ success: false, message: "Invalid variants payload" });
      }
    }
    const imageUrl = req.file?.filename;
    const result = await menuService.createFoodWithVariants({
      categoryId,
      name,
      description,
      imageUrl,
      variants,
    });
    res.json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Create food error", error);
    res.status(500).json({ success: false, message: error.message || "Could not create food" });
  }
};

export const updateFood = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const { foodId } = req.params;
    const normalise = (value) =>
      value === undefined || value === null || value === "" ? undefined : value;
    const { name, description, categoryId } = req.body || {};
    const result = await menuService.updateFoodDetails({
      foodId,
      name,
      description,
      categoryId: normalise(categoryId),
      imageFilename: req.file?.filename,
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Update food error", error);
    res.status(500).json({ success: false, message: "Failed to update food" });
  }
};export const archiveFood = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const { foodId } = req.params;
    const result = await menuService.archiveFood({ foodId });
    res.json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Archive food error", error);
    res.status(500).json({ success: false, message: "Could not archive food" });
  }
};

export const setFoodStatus = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const { foodId } = req.params;
    const { isActive } = req.body;
    const result = await menuService.setFoodSaleStatus({
      foodId,
      isActive: Boolean(isActive),
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Set food status error", error);
    res.status(500).json({ success: false, message: "Failed to update food status" });
  }
};

export const setVariantStatus = async (req, res) => {
  try {
    const context = await ensureMenuManager(req.userId || req.body.userId);
    const { variantId } = req.params;
    const { isActive } = req.body;
    const result = await menuService.setVariantSaleStatus({
      variantId,
      isActive: Boolean(isActive),
      context,
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Set variant status error", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update variant status" });
  }
};

export const updateVariant = async (req, res) => {
  try {
    const context = await ensureMenuManager(req.userId || req.body.userId);
    const { variantId } = req.params;
    const { price } = req.body;
    const result = await menuService.updateVariantDetails({
      variantId,
      price,
      context,
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Update variant error", error);
    res.status(500).json({ success: false, message: "Failed to update variant" });
  }
};

export const removeVariant = async (req, res) => {
  try {
    const context = await ensureMenuManager(req.userId || req.body.userId);
    const { variantId } = req.params;
    const result = await menuService.deleteVariant({ variantId, context });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Delete variant error", error);
    res.status(500).json({ success: false, message: "Failed to delete variant" });
  }
};

export default {
  getDefaultMenu,
  createCategory,
  createFood,
  updateFood,
  archiveFood,
  setFoodStatus,
  setVariantStatus,
  updateVariant,
  removeVariant,
};
