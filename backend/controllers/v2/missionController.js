import * as missionRepo from "../../repositories/v2/missionRepository.js";
import { completeDelivery } from "../../services/v2/missionService.js";

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

export default { completeMission, getMission };
