import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  listNotifications,
  markNotificationsRead,
} from "../controllers/v2/notificationController.js";

const notificationV2Router = express.Router();

notificationV2Router.use(authMiddleware);

notificationV2Router.get("/", listNotifications);
notificationV2Router.post("/mark-read", markNotificationsRead);

export default notificationV2Router;
