import express from "express";
import { createUploader } from "../config/uploader.js";
import authMiddleware from "../middleware/auth.js";
import {
  loginUser,
  registerUser,
  getProfile,
  updateProfile,
} from "../controllers/userController.js";

const userRouter = express.Router();

const upload = createUploader({ folder: "fastfoodonline/avatars" });

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/profile", authMiddleware, getProfile);
userRouter.put(
  "/profile",
  authMiddleware,
  upload.single("avatar"),
  updateProfile
);

export default userRouter;
