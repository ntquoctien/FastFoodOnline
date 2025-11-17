import * as measurementUnitService from "../../services/v2/measurementUnitService.js";
import * as userRepo from "../../repositories/userRepository.js";

const ensureAdmin = async (userId) => {
  if (!userId) {
    throw new Error("NOT_AUTHORISED");
  }
  const user = await userRepo.findById(userId);
  if (!user || user.role !== "admin") {
    throw new Error("NOT_AUTHORISED");
  }
  return user;
};

const unauthorised = (res) =>
  res.status(403).json({ success: false, message: "Not authorised" });

export const listUnits = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const result = await measurementUnitService.listUnits({ includeInactive });
    res.json(result);
  } catch (error) {
    console.error("List units error", error);
    res.status(500).json({ success: false, message: "Failed to load units" });
  }
};

export const createUnit = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const result = await measurementUnitService.createUnit(req.body);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return unauthorised(res);
    }
    console.error("Create unit error", error);
    res.status(500).json({ success: false, message: "Failed to create unit" });
  }
};

export const updateUnit = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const result = await measurementUnitService.updateUnit({
      unitId: req.params.unitId,
      payload: req.body,
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return unauthorised(res);
    }
    console.error("Update unit error", error);
    res.status(500).json({ success: false, message: "Failed to update unit" });
  }
};

export const removeUnit = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const result = await measurementUnitService.deleteUnit({
      unitId: req.params.unitId,
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return unauthorised(res);
    }
    console.error("Delete unit error", error);
    res.status(500).json({ success: false, message: "Failed to delete unit" });
  }
};

export default {
  listUnits,
  createUnit,
  updateUnit,
  removeUnit,
};
