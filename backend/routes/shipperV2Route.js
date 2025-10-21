import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  listShippers,
  updateShipperStatus,
  createShipper,
} from "../controllers/v2/shipperController.js";

const shipperV2Router = express.Router();

shipperV2Router.get("/", authMiddleware, listShippers);
shipperV2Router.post("/", authMiddleware, createShipper);
shipperV2Router.patch("/:shipperId/status", authMiddleware, updateShipperStatus);

export default shipperV2Router;
