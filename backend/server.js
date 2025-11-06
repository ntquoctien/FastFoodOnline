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
import staffV2Router from "./routes/staffV2Route.js";
import notificationV2Router from "./routes/notificationV2Route.js";
import categoryV2Router from "./routes/categoryV2Route.js";

// app config
const app = express();
const port =process.env.PORT || 4000;

//middlewares
app.use(express.json());
app.use(cors());
<<<<<<< Updated upstream
=======
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { explorer: true })
);
>>>>>>> Stashed changes

// DB connection
connectDB();

<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
=======
>>>>>>> Stashed changes
// Allow tooling (Postman, etc.) to fetch the raw OpenAPI document.
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
app.use("/api/v2/staff", staffV2Router);
app.use("/api/v2/notifications", notificationV2Router);
app.use("/api/v2/categories", categoryV2Router);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () => {
  console.log(`Server Started on port: ${port}`);
});
