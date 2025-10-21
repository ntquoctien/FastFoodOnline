import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";
import {
  loginUser,
  registerUser,
  getProfile,
  updateProfile,
} from "../controllers/userController.js";

const userRouter = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
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
