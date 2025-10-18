import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";
import {
  getDefaultMenu,
  createCategory,
  createFood,
  archiveFood,
} from "../controllers/v2/menuController.js";

const menuV2Router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

menuV2Router.get("/default", getDefaultMenu);
menuV2Router.post("/categories", authMiddleware, createCategory);
menuV2Router.post(
  "/foods",
  authMiddleware,
  upload.single("image"),
  createFood
);
menuV2Router.delete("/foods/:foodId", authMiddleware, archiveFood);

export default menuV2Router;
