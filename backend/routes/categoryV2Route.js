import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/v2/categoryController.js";

const categoryV2Router = express.Router();

categoryV2Router.use(authMiddleware);

categoryV2Router.get("/", listCategories);
categoryV2Router.post("/", createCategory);
categoryV2Router.patch("/:categoryId", updateCategory);
categoryV2Router.delete("/:categoryId", deleteCategory);

export default categoryV2Router;
