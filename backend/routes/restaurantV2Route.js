import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getSettings,
  updateSettings,
} from "../controllers/v2/restaurantController.js";

const restaurantV2Router = express.Router();

restaurantV2Router.use(authMiddleware);

restaurantV2Router.get("/", getSettings);
restaurantV2Router.put("/", updateSettings);

export default restaurantV2Router;
