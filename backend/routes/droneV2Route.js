import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  listDrones,
  updateDrone,
  seedDrones,
  webhookStatus,
  createDrone,
  deleteDrone,
} from "../controllers/v2/droneController.js";

const droneV2Router = express.Router();

// Admin-only
droneV2Router.get("/", authMiddleware, listDrones);
droneV2Router.post("/", authMiddleware, createDrone);
droneV2Router.post("/seed", authMiddleware, seedDrones);
droneV2Router.patch("/:droneId/status", authMiddleware, updateDrone);
droneV2Router.patch("/:droneId", authMiddleware, updateDrone);
droneV2Router.delete("/:droneId", authMiddleware, deleteDrone);

// Webhook (secured via shared secret header if configured)
droneV2Router.post("/webhook/status", express.json(), webhookStatus);

export default droneV2Router;
