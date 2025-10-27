import express from "express";
import multer from "multer";
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
