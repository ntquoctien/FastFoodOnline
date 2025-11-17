import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  listUnits,
  createUnit,
  updateUnit,
  removeUnit,
} from "../controllers/v2/measurementUnitController.js";

const measurementUnitRouter = express.Router();

measurementUnitRouter.get("/", listUnits);
measurementUnitRouter.post("/", authMiddleware, createUnit);
measurementUnitRouter.put("/:unitId", authMiddleware, updateUnit);
measurementUnitRouter.delete("/:unitId", authMiddleware, removeUnit);

export default measurementUnitRouter;
