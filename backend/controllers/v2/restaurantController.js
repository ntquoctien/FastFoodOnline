import * as restaurantService from "../../services/v2/restaurantService.js";
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

export const getSettings = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const result = await restaurantService.getSettings();
    res.json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Get restaurant settings error", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load restaurant settings" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    await ensureAdmin(req.userId || req.body.userId);
    const result = await restaurantService.upsertSettings(req.body || {});
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    if (error.message === "NOT_AUTHORISED") {
      return handleUnauthorised(res);
    }
    console.error("Update restaurant settings error", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update restaurant settings" });
  }
};

export default {
  getSettings,
  updateSettings,
};
