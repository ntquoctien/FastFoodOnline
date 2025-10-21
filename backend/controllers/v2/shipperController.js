import * as shipperService from "../../services/v2/shipperService.js";

const handleError = (res, error, fallback) => {
  if (error.message === "NOT_AUTHORISED") {
    return res
      .status(403)
      .json({ success: false, message: "You are not allowed to perform this action" });
  }
  if (error.message === "USER_NOT_FOUND") {
    return res.status(401).json({ success: false, message: "User not found" });
  }
  if (error.message === "INVALID_STATUS") {
    return res.status(400).json({ success: false, message: "Invalid shipper status" });
  }
  if (error.message === "INVALID_NAME") {
    return res.status(400).json({ success: false, message: "Name is required" });
  }
  if (error.message === "INVALID_EMAIL") {
    return res.status(400).json({ success: false, message: "Please enter a valid email" });
  }
  if (error.message === "EMAIL_IN_USE") {
    return res
      .status(400)
      .json({ success: false, message: "Email is already in use by another account" });
  }
  if (error.message === "SHIPPER_EXISTS") {
    return res
      .status(409)
      .json({ success: false, message: "A shipper profile already exists for this user" });
  }
  if (error.message === "BRANCH_REQUIRED") {
    return res.status(400).json({ success: false, message: "Select a branch for this shipper" });
  }
  if (error.message === "BRANCH_NOT_FOUND") {
    return res.status(404).json({ success: false, message: "Branch not found" });
  }
  if (error.message === "INVALID_VEHICLE") {
    return res.status(400).json({ success: false, message: "Unsupported vehicle type" });
  }
  console.error(fallback, error);
  return res.status(500).json({ success: false, message: "Shipper action failed" });
};

export const listShippers = async (req, res) => {
  try {
    const result = await shipperService.listShippers({
      userId: req.userId || req.body.userId,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Shipper list error");
  }
};

export const updateShipperStatus = async (req, res) => {
  try {
    const { shipperId } = req.params;
    const { status } = req.body;
    const result = await shipperService.updateShipperStatus({
      userId: req.userId || req.body.userId,
      shipperId,
      status,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Shipper update error");
  }
};

export const createShipper = async (req, res) => {
  try {
    const result = await shipperService.createShipper({
      userId: req.userId || req.body.userId,
      name: req.body.name,
      email: req.body.email,
      branchId: req.body.branchId,
      vehicleType: req.body.vehicleType,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Shipper create error");
  }
};

export default { listShippers, updateShipperStatus, createShipper };
