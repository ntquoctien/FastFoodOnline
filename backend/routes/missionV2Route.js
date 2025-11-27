import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  completeMission,
  getMission,
} from "../controllers/v2/missionController.js";

const missionV2Router = express.Router();

missionV2Router.get("/:id", authMiddleware, getMission);
missionV2Router.post("/:id/complete", authMiddleware, completeMission);

export default missionV2Router;
