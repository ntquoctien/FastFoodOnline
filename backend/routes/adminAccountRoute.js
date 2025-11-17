import express from "express";
import {
  addAdmin,
  getAdmins,
} from "../controllers/v2/adminAccountController.js";
import authMiddleware from "../middleware/auth.js";

const adminAccountRouter = express.Router();

adminAccountRouter.use(authMiddleware);
adminAccountRouter.get("/", getAdmins);
adminAccountRouter.post("/", addAdmin);

export default adminAccountRouter;

