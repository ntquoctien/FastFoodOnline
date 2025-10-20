import * as branchService from "../../services/v2/branchService.js";
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

export const listBranches = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const includeInactive = req.query.includeInactive === "true";
    const result = await branchService.listBranches({ includeInactive });
    res.json(result);
  } catch (error) {
    console.error("List branches error", error);
    res.status(500).json({ success: false, message: "Failed to load branches" });
  }
};

export const createBranch = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const result = await branchService.createBranch(req.body || {});
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Create branch error", error);
    res.status(500).json({ success: false, message: "Failed to create branch" });
  }
};

export const updateBranch = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const { branchId } = req.params;
    const result = await branchService.updateBranch({
      branchId,
      payload: req.body || {},
    });

    if (!result.success && result.message === "Branch not found") {
      return res.status(404).json(result);
    }

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Update branch error", error);
    res.status(500).json({ success: false, message: "Failed to update branch" });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const { branchId } = req.params;
    const result = await branchService.deleteBranch({ branchId });

    if (!result.success && result.message === "Branch not found") {
      return res.status(404).json(result);
    }

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Delete branch error", error);
    res.status(500).json({ success: false, message: "Failed to delete branch" });
  }
};

export default {
  listBranches,
  createBranch,
  updateBranch,
  deleteBranch,
};
