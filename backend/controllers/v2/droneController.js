import * as droneService from "../../services/v2/droneService.js";

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
    return res.status(400).json({ success: false, message: "Invalid drone status" });
  }
  if (error.message === "INVALID_BATTERY") {
    return res.status(400).json({ success: false, message: "Invalid battery level" });
  }
  if (error.message === "INVALID_CODE") {
    return res.status(400).json({ success: false, message: "Drone code is required" });
  }
  if (error.message === "CODE_IN_USE") {
    return res.status(409).json({ success: false, message: "Drone code already in use" });
  }
  if (error.message === "INVALID_PAYLOAD") {
    return res.status(400).json({ success: false, message: "Invalid payload (kg)" });
  }
  if (error.message === "BRANCH_NOT_FOUND") {
    return res.status(404).json({ success: false, message: "Branch not found" });
  }
  if (error.message === "INVALID_BRANCH") {
    return res.status(400).json({ success: false, message: "Invalid branch" });
  }
  console.error(fallback, error);
  return res.status(500).json({ success: false, message: "Drone action failed" });
};

export const listDrones = async (req, res) => {
  try {
    const result = await droneService.listDrones({
      userId: req.userId || req.body.userId,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Drone list error");
  }
};

export const updateDrone = async (req, res) => {
  try {
    const { droneId } = req.params;
    const { status, batteryLevel, lastKnownLat, lastKnownLng, code, branchId, maxPayloadKg } =
      req.body;
    const result = await droneService.updateDrone({
      userId: req.userId || req.body.userId,
      droneId,
      status,
      batteryLevel,
      lastKnownLat,
      lastKnownLng,
      code,
      branchId,
      maxPayloadKg,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Drone update error");
  }
};

export const seedDrones = async (req, res) => {
  try {
    const { branchId, count, prefix, maxPayloadKg } = req.body;
    const result = await droneService.seedSampleDrones({
      userId: req.userId || req.body.userId,
      branchId,
      count,
      prefix,
      maxPayloadKg,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Drone seed error");
  }
};

export const createDrone = async (req, res) => {
  try {
    const { code, branchId, maxPayloadKg, batteryLevel, status, lastKnownLat, lastKnownLng } =
      req.body;
    const result = await droneService.createDrone({
      userId: req.userId || req.body.userId,
      code,
      branchId,
      maxPayloadKg,
      batteryLevel,
      status,
      lastKnownLat,
      lastKnownLng,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Drone create error");
  }
};

export const deleteDrone = async (req, res) => {
  try {
    const { droneId } = req.params;
    const result = await droneService.deleteDrone({
      userId: req.userId || req.body.userId,
      droneId,
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    handleError(res, error, "Drone delete error");
  }
};

export const webhookStatus = async (req, res) => {
  try {
    const secret = process.env.DRONE_WEBHOOK_SECRET;
    if (secret) {
      const headerSecret = req.headers["x-drone-secret"];
      if (!headerSecret || headerSecret !== secret) {
        return res.status(403).json({ success: false, message: "Invalid webhook secret" });
      }
    }
    const { assignmentId, orderId, droneId, status, meta } = req.body || {};
    const result = await droneService.handleDroneStatusEvent({
      assignmentId,
      orderId,
      droneId,
      status,
      meta,
    });
    const httpStatus = result.success ? 200 : 400;
    res.status(httpStatus).json(result);
  } catch (error) {
    console.error("Drone webhook error", error);
    res.status(500).json({ success: false, message: "Drone webhook failed" });
  }
};

export default {
  listDrones,
  updateDrone,
  createDrone,
  deleteDrone,
  seedDrones,
  webhookStatus,
};
