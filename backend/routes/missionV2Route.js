import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  completeMission,
  getMission,
  markArrived,
} from "../controllers/v2/missionController.js";

const missionV2Router = express.Router();

missionV2Router.get("/:id", authMiddleware, getMission);
missionV2Router.post("/:id/complete", authMiddleware, completeMission);
missionV2Router.post("/:id/mark-arrived", authMiddleware, markArrived);

export default missionV2Router;
