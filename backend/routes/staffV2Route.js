import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  addStaff,
  changeStaffStatus,
  getStaff,
  resetPassword,
} from "../controllers/v2/staffController.js";

const staffV2Router = express.Router();

staffV2Router.use(authMiddleware);

staffV2Router.get("/", getStaff);
staffV2Router.post("/", addStaff);
staffV2Router.patch("/:staffId/status", changeStaffStatus);
staffV2Router.post("/:staffId/reset-password", resetPassword);

export default staffV2Router;
