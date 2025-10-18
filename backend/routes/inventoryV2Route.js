import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  listInventory,
  updateInventory,
} from "../controllers/v2/inventoryController.js";

const inventoryV2Router = express.Router();

inventoryV2Router.get("/", authMiddleware, listInventory);
inventoryV2Router.post("/", authMiddleware, updateInventory);

export default inventoryV2Router;
