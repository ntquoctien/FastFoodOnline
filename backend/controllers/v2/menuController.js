import * as menuService from "../../services/v2/menuService.js";
import * as userRepo from "../../repositories/userRepository.js";

const ensureAdmin = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user || user.role !== "admin") {
    throw new Error("NOT_AUTHORISED");
  }
};

const handleUnauthorised = (res) =>
  res
    .status(403)
    .json({ success: false, message: "You are not allowed to perform this action" });

export const getDefaultMenu = async (req, res) => {
  try {
    const result = await menuService.getDefaultMenu({ branchId: req.query.branchId });
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
    const result = await menuService.createCategory({ name, description });
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

export const archiveFood = async (req, res) => {
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

export default { getDefaultMenu, createCategory, createFood, archiveFood };
