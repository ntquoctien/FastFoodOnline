import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  list,
  create,
  getOne,
  update,
  remove,
} from "../controllers/v2/hubController.js";

const hubV2Router = express.Router();

hubV2Router.get("/", authMiddleware, list);
hubV2Router.post("/", authMiddleware, create);
hubV2Router.get("/:hubId", authMiddleware, getOne);
hubV2Router.put("/:hubId", authMiddleware, update);
hubV2Router.delete("/:hubId", authMiddleware, remove);

export default hubV2Router;

