import * as categoryService from "../../services/v2/categoryService.js";
import * as userRepo from "../../repositories/userRepository.js";

const ensureAdmin = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user || user.role !== "admin") {
    throw new Error("NOT_AUTHORISED");
  }
};

const handleAuthorisationError = (res) =>
  res
    .status(403)
    .json({ success: false, message: "You are not allowed to perform this action" });

const respondFromService = (res, result) => {
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
};

export const listCategories = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const includeInactive = req.query.includeInactive === "true";
    const result = await categoryService.listCategories({ includeInactive });
    res.json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleAuthorisationError(res);
    }
    console.error("List categories error", error);
    res.status(500).json({ success: false, message: "Failed to load categories" });
  }
};

export const createCategory = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const result = await categoryService.createCategory(req.body || {});
    respondFromService(res, result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleAuthorisationError(res);
    }
    console.error("Create category error", error);
    res.status(500).json({ success: false, message: "Failed to create category" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const result = await categoryService.updateCategory({
      categoryId: req.params.categoryId,
      ...req.body,
    });
    respondFromService(res, result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleAuthorisationError(res);
    }
    console.error("Update category error", error);
    res.status(500).json({ success: false, message: "Failed to update category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const result = await categoryService.deleteCategory({
      categoryId: req.params.categoryId,
    });
    respondFromService(res, result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleAuthorisationError(res);
    }
    console.error("Delete category error", error);
    res.status(500).json({ success: false, message: "Failed to delete category" });
  }
};

export default {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
