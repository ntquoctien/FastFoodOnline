import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  listBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../controllers/v2/branchController.js";

const branchV2Router = express.Router();

branchV2Router.use(authMiddleware);

branchV2Router.get("/", listBranches);
branchV2Router.post("/", createBranch);
branchV2Router.put("/:branchId", updateBranch);
branchV2Router.delete("/:branchId", deleteBranch);

export default branchV2Router;
