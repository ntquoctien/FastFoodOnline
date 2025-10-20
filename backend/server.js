import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import menuV2Router from "./routes/menuV2Route.js";
import orderV2Router from "./routes/orderV2Route.js";
import inventoryV2Router from "./routes/inventoryV2Route.js";
import shipperV2Router from "./routes/shipperV2Route.js";
import branchV2Router from "./routes/branchV2Route.js";

// app config
const app = express();
const port =process.env.PORT || 4000;

//middlewares
app.use(express.json());
app.use(cors());

// DB connection
connectDB();

// api endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/v2/menu", menuV2Router);
app.use("/api/v2/orders", orderV2Router);
app.use("/api/v2/inventory", inventoryV2Router);
app.use("/api/v2/shippers", shipperV2Router);
app.use("/api/v2/branches", branchV2Router);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () => {
  console.log(`Server Started on port: ${port}`);
});
