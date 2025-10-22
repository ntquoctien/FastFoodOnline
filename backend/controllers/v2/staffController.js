import {
  createStaff,
  listStaff,
  resetStaffPassword,
  updateStaffProfile,
  updateStaffStatus,
} from "../../services/v2/staffService.js";

const handleError = (res, error, fallbackMessage) => {
  if (error.message === "NOT_AUTHORISED") {
    return res
      .status(403)
      .json({ success: false, message: "You are not allowed to perform this action" });
  }
  if (error.message === "BRANCH_NOT_FOUND") {
    return res.status(404).json({ success: false, message: "Branch not found" });
  }
  if (error.message === "STAFF_NOT_FOUND") {
    return res.status(404).json({ success: false, message: "Staff member not found" });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ success: false, message: "Staff operation failed" });
};

export const getStaff = async (req, res) => {
  try {
    const result = await listStaff({ userId: req.userId || req.body.userId });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Staff list error");
  }
};

export const addStaff = async (req, res) => {
  try {
    const result = await createStaff({ userId: req.userId || req.body.userId, ...req.body });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    handleError(res, error, "Staff create error");
  }
};

export const changeStaffStatus = async (req, res) => {
  try {
    const result = await updateStaffStatus({
      userId: req.userId || req.body.userId,
      staffId: req.params.staffId,
      status: req.body.status,
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    handleError(res, error, "Staff status update error");
  }
};

export const resetPassword = async (req, res) => {
  try {
    const result = await resetStaffPassword({
      userId: req.userId || req.body.userId,
      staffId: req.params.staffId,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Staff password reset error");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const result = await updateStaffProfile({
      userId: req.userId || req.body.userId,
      staffId: req.params.staffId,
      ...req.body,
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    handleError(res, error, "Staff profile update error");
  }
};

export default {
  getStaff,
  addStaff,
  changeStaffStatus,
  resetPassword,
  updateProfile,
};
