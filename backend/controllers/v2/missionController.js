import * as missionRepo from "../../repositories/v2/missionRepository.js";
import {
  completeDelivery,
  markMissionArrived,
} from "../../services/v2/missionService.js";
import * as userRepo from "../../repositories/userRepository.js";

const getUser = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    const error = new Error("USER_NOT_FOUND");
    throw error;
  }
  return user;
};

export const completeMission = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await completeDelivery({ missionId: id });
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error("Mission complete error", error);
    res.status(500).json({ success: false, message: "Failed to complete mission" });
  }
};

export const getMission = async (req, res) => {
  try {
    const { id } = req.params;
    const mission = await missionRepo.findById(id);
    if (!mission) {
      return res.status(404).json({ success: false, message: "Mission not found" });
    }
    return res.json({ success: true, data: mission });
  } catch (error) {
    console.error("Mission fetch error", error);
    res.status(500).json({ success: false, message: "Failed to fetch mission" });
  }
};

const handleMissionError = (res, error, fallbackMessage) => {
  if (error.message === "MISSION_NOT_FOUND") {
    return res.status(404).json({ success: false, message: "Mission not found" });
  }
  if (error.message === "ORDER_NOT_FOUND") {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (error.message === "NOT_AUTHORISED") {
    return res.status(403).json({ success: false, message: "You are not allowed to perform this action" });
  }
  if (error.message === "USER_NOT_FOUND") {
    return res.status(401).json({ success: false, message: "User not found" });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ success: false, message: "Mission action failed" });
};

export const markArrived = async (req, res, next) => {
  try {
    const missionId = req.params.id;
    const userId = req.userId || req.body.userId;
    const actorUser = await getUser(userId);
    const result = await markMissionArrived(missionId, actorUser);
    res.json(result);
  } catch (error) {
    handleMissionError(res, error, "Mission mark-arrived error");
  }
};

export default { completeMission, getMission, markArrived };
