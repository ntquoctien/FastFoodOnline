import express from "express";
import {
  getCustomerOrderHistory,
  getCustomers,
} from "../controllers/v2/customerController.js";
import authMiddleware from "../middleware/auth.js";

const customerRouter = express.Router();

customerRouter.use(authMiddleware);
customerRouter.get("/", getCustomers);
customerRouter.get("/:customerId/orders", getCustomerOrderHistory);

export default customerRouter;

