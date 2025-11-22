import * as menuService from "../../services/v2/menuService.js";
import * as userRepo from "../../repositories/userRepository.js";
import * as categoryService from "../../services/v2/categoryService.js";
import * as notificationService from "../../services/v2/notificationService.js";

const BRANCH_MANAGER_ROLES = ["manager", "branch_manager"];
const MENU_NOTIFICATION_ROLES = ["admin", "manager", "branch_manager", "all"];

const ensureAdmin = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user || user.role !== "admin") {
    throw new Error("NOT_AUTHORISED");
  }
  return user;
};

const ensureMenuManager = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new Error("NOT_AUTHORISED");
  }
  if (user.role === "admin") {
    return { role: "admin", user };
  }
  if (["manager", "branch_manager"].includes(user.role) && user.branchId) {
    return { role: "branch_manager", branchId: user.branchId, user };
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
  let actor = null;
  try {
    actor = await ensureAdmin(req.userId || req.body.userId);
    const { name, description, categoryId } = req.body;
    let variants = [];
    if (req.body.variants) {
      try {
        variants = JSON.parse(req.body.variants);
      } catch (parseError) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid variants payload" });
      }
    }
    const imageUrl = req.file?.path || req.file?.filename;
    const result = await menuService.createFoodWithVariants({
      categoryId,
      name,
      description,
      imageUrl,
      variants,
    });
    if (result.success) {
      await notificationService.publishNotification({
        title: "Món mới được tạo",
        message: `${actor?.name || "Admin"} đã tạo món ${
          result.data?.name || name
        }`,
        action: "create",
        entityType: "food",
        entityId: result.data?._id,
        actor,
        targetRoles: MENU_NOTIFICATION_ROLES,
        metadata: {
          categoryId,
          variantCount: variants.length,
        },
      });
    } else {
      await notificationService.publishNotification({
        title: "Tạo món ăn thất bại",
        message: result.message || "Không thể tạo món ăn mới",
        action: "create",
        level: "warning",
        status: "failed",
        entityType: "food",
        actor,
        targetRoles: ["admin"],
      });
    }
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Create food error", error);
    if (actor) {
      await notificationService.publishNotification({
        title: "Lỗi khi tạo món ăn",
        message: error.message || "Không thể tạo món ăn",
        action: "create",
        level: "error",
        status: "failed",
        entityType: "food",
        actor,
        targetRoles: ["admin"],
      });
    }
    res
      .status(500)
      .json({ success: false, message: error.message || "Could not create food" });
  }
};

export const updateFood = async (req, res) => {
  let actor = null;
  try {
    actor = await ensureAdmin(req.userId || req.body.userId);
    const { foodId } = req.params;
    const normalise = (value) =>
      value === undefined || value === null || value === "" ? undefined : value;
    const { name, description, categoryId } = req.body || {};
    const result = await menuService.updateFoodDetails({
      foodId,
      name,
      description,
      categoryId: normalise(categoryId),
      imageUrl: req.file?.path || req.file?.filename,
    });
    if (result.success) {
      await notificationService.publishNotification({
        title: "Món ăn đã được cập nhật",
        message: `${actor?.name || "Admin"} đã chỉnh sửa ${
          result.data?.name || "một món ăn"
        }`,
        action: "update",
        entityType: "food",
        entityId: result.data?._id || foodId,
        actor,
        targetRoles: MENU_NOTIFICATION_ROLES,
      });
    } else {
      await notificationService.publishNotification({
        title: "Cập nhật món ăn thất bại",
        message: result.message || "Không thể cập nhật món ăn",
        action: "update",
        level: "warning",
        status: "failed",
        entityType: "food",
        entityId: foodId,
        actor,
        targetRoles: ["admin"],
      });
    }
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Update food error", error);
    if (actor) {
      await notificationService.publishNotification({
        title: "Lỗi khi cập nhật món ăn",
        message: error.message || "Không thể cập nhật món ăn",
        action: "update",
        level: "error",
        status: "failed",
        entityType: "food",
        actor,
        targetRoles: ["admin"],
      });
    }
    res.status(500).json({ success: false, message: "Failed to update food" });
  }
};

export const archiveFood = async (req, res) => {
  let actor = null;
  try {
    actor = await ensureAdmin(req.userId || req.body.userId);
    const { foodId } = req.params;
    const result = await menuService.archiveFood({ foodId });
    if (result.success) {
      await notificationService.publishNotification({
        title: "Món ăn đã bị gỡ",
        message: `${actor?.name || "Admin"} đã lưu trữ món ${
          result.data?.name || foodId
        }`,
        action: "delete",
        entityType: "food",
        entityId: result.data?._id || foodId,
        actor,
        targetRoles: MENU_NOTIFICATION_ROLES,
      });
    } else {
      await notificationService.publishNotification({
        title: "Không thể lưu trữ món ăn",
        message: result.message || "Thao tác thất bại",
        action: "delete",
        level: "warning",
        status: "failed",
        entityType: "food",
        entityId: foodId,
        actor,
        targetRoles: ["admin"],
      });
    }
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Archive food error", error);
    if (actor) {
      await notificationService.publishNotification({
        title: "Lỗi lưu trữ món ăn",
        message: error.message || "Không thể lưu trữ món",
        action: "delete",
        level: "error",
        status: "failed",
        entityType: "food",
        actor,
        targetRoles: ["admin"],
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Could not archive food" });
  }
};

export const setFoodStatus = async (req, res) => {
  let actor = null;
  try {
    actor = await ensureAdmin(req.userId || req.body.userId);
    const { foodId } = req.params;
    const { isActive } = req.body;
    const result = await menuService.setFoodSaleStatus({
      foodId,
      isActive: Boolean(isActive),
    });
    if (result.success) {
      const statusLabel = Boolean(isActive) ? "mở bán" : "tạm dừng";
      await notificationService.publishNotification({
        title: `Trạng thái món đã được ${statusLabel}`,
        message: `${actor?.name || "Admin"} đã ${statusLabel} ${
          result.data?.food?.name || "một món ăn"
        }`,
        action: "status",
        entityType: "food",
        entityId: result.data?.food?._id || foodId,
        actor,
        targetRoles: MENU_NOTIFICATION_ROLES,
      });
    } else {
      await notificationService.publishNotification({
        title: "Không thể đổi trạng thái món",
        message: result.message || "Thao tác thất bại",
        action: "status",
        level: "warning",
        status: "failed",
        entityType: "food",
        entityId: foodId,
        actor,
        targetRoles: ["admin"],
      });
    }
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Set food status error", error);
    if (actor) {
      await notificationService.publishNotification({
        title: "Lỗi đổi trạng thái món",
        message: error.message || "Không thể đổi trạng thái",
        action: "status",
        level: "error",
        status: "failed",
        entityType: "food",
        actor,
        targetRoles: ["admin"],
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to update food status" });
  }
};

export const setVariantStatus = async (req, res) => {
  try {
    const context = await ensureMenuManager(req.userId || req.body.userId);
    const actor = context.user;
    const { variantId } = req.params;
    const { isActive } = req.body;
    const result = await menuService.setVariantSaleStatus({
      variantId,
      isActive: Boolean(isActive),
      context,
    });
    if (result.success) {
      const variant = result.data?.variant || {};
      const statusLabel = Boolean(isActive) ? "mở bán" : "tạm dừng";
      await notificationService.publishNotification({
        title: `Biến thể được ${statusLabel}`,
        message: `${actor?.name || "Hệ thống"} đã ${statusLabel} biến thể ${
          variant.size || ""
        }`,
        action: "status",
        entityType: "variant",
        entityId: variant._id || variantId,
        actor,
        targetRoles: MENU_NOTIFICATION_ROLES,
        targetBranchId:
          variant.branchId || context.branchId || actor?.branchId || null,
        metadata: {
          branchId: variant.branchId || context.branchId || actor?.branchId,
          variantSize: variant.size,
        },
      });
    } else {
      await notificationService.publishNotification({
        title: "Không thể đổi trạng thái biến thể",
        message: result.message || "Thao tác thất bại",
        action: "status",
        level: "warning",
        status: "failed",
        entityType: "variant",
        entityId: variantId,
        actor,
        targetRoles: ["admin"],
        targetBranchId: context.branchId || actor?.branchId || null,
      });
    }
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Set variant status error", error);
    await notificationService.publishNotification({
      title: "Lỗi đổi trạng thái biến thể",
      message: error.message || "Không thể đổi trạng thái",
      action: "status",
      level: "error",
      status: "failed",
      entityType: "variant",
      entityId: req.params.variantId,
      actor: null,
      targetRoles: ["admin"],
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to update variant status" });
  }
};

export const updateVariant = async (req, res) => {
  try {
    const context = await ensureMenuManager(req.userId || req.body.userId);
    const actor = context.user;
    const { variantId } = req.params;
    const { price } = req.body;
    const result = await menuService.updateVariantDetails({
      variantId,
      price,
      context,
    });
    if (result.success) {
      await notificationService.publishNotification({
        title: "Giá biến thể đã được cập nhật",
        message: `${actor?.name || "Hệ thống"} đặt giá mới ${
          result.data?.price ?? price
        }đ cho ${result.data?.size || ""}`,
        action: "update",
        entityType: "variant",
        entityId: result.data?._id || variantId,
        actor,
        targetRoles: MENU_NOTIFICATION_ROLES,
        targetBranchId:
          result.data?.branchId || context.branchId || actor?.branchId || null,
        metadata: {
          branchId: result.data?.branchId || context.branchId || actor?.branchId,
          size: result.data?.size,
          price: result.data?.price ?? price,
        },
      });
    } else {
      await notificationService.publishNotification({
        title: "Cập nhật giá biến thể thất bại",
        message: result.message || "Không thể cập nhật biến thể",
        action: "update",
        level: "warning",
        status: "failed",
        entityType: "variant",
        entityId: variantId,
        actor,
        targetRoles: ["admin"],
        targetBranchId: context.branchId || actor?.branchId || null,
      });
    }
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Update variant error", error);
    await notificationService.publishNotification({
      title: "Lỗi cập nhật biến thể",
      message: error.message || "Không thể cập nhật biến thể",
      action: "update",
      level: "error",
      status: "failed",
      entityType: "variant",
      entityId: req.params.variantId,
      targetRoles: ["admin"],
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to update variant" });
  }
};

export const removeVariant = async (req, res) => {
  try {
    const context = await ensureMenuManager(req.userId || req.body.userId);
    const actor = context.user;
    const { variantId } = req.params;
    const result = await menuService.deleteVariant({ variantId, context });
    if (result.success) {
      await notificationService.publishNotification({
        title: "Đã xóa biến thể",
        message: `${actor?.name || "Hệ thống"} đã xóa biến thể ${
          result.data?.size || ""
        }`,
        action: "delete",
        entityType: "variant",
        entityId: result.data?._id || variantId,
        actor,
        targetRoles: MENU_NOTIFICATION_ROLES,
        targetBranchId:
          result.data?.branchId || context.branchId || actor?.branchId || null,
        metadata: {
          branchId: result.data?.branchId || context.branchId || actor?.branchId,
          size: result.data?.size,
        },
      });
    } else {
      await notificationService.publishNotification({
        title: "Xóa biến thể thất bại",
        message: result.message || "Không thể xóa biến thể",
        action: "delete",
        level: "warning",
        status: "failed",
        entityType: "variant",
        entityId: variantId,
        actor,
        targetRoles: ["admin"],
        targetBranchId: context.branchId || actor?.branchId || null,
      });
    }
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Delete variant error", error);
    await notificationService.publishNotification({
      title: "Lỗi xóa biến thể",
      message: error.message || "Không thể xóa biến thể",
      action: "delete",
      level: "error",
      status: "failed",
      entityType: "variant",
      entityId: req.params.variantId,
      targetRoles: ["admin"],
    });
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
