import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import authMiddleware from "../middleware/auth.js";
import {
  getDefaultMenu,
  createCategory,
  createFood,
  updateFood,
  archiveFood,
  setFoodStatus,
  setVariantStatus,
  updateVariant,
  removeVariant,
} from "../controllers/v2/menuController.js";

const menuV2Router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "fastfoodonline/menu",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    use_filename: true,
    unique_filename: true,
    transformation: [{ quality: "auto", fetch_format: "auto" }],
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
menuV2Router.put(
  "/foods/:foodId",
  authMiddleware,
  upload.single("image"),
  updateFood
);
menuV2Router.delete("/foods/:foodId", authMiddleware, archiveFood);
menuV2Router.put("/foods/:foodId/status", authMiddleware, setFoodStatus);
menuV2Router.put("/variants/:variantId/status", authMiddleware, setVariantStatus);
menuV2Router.put("/variants/:variantId", authMiddleware, updateVariant);
menuV2Router.delete("/variants/:variantId", authMiddleware, removeVariant);

export default menuV2Router;
