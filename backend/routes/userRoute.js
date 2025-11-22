import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import authMiddleware from "../middleware/auth.js";
import {
  loginUser,
  registerUser,
  getProfile,
  updateProfile,
} from "../controllers/userController.js";

const userRouter = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "fastfoodonline/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    use_filename: true,
    unique_filename: true,
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

const upload = multer({ storage });

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
