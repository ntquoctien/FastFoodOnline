import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import menuV2Router from "./routes/menuV2Route.js";
import orderV2Router from "./routes/orderV2Route.js";
import inventoryV2Router from "./routes/inventoryV2Route.js";
import branchV2Router from "./routes/branchV2Route.js";
import staffV2Router from "./routes/staffV2Route.js";
import notificationV2Router from "./routes/notificationV2Route.js";
import categoryV2Router from "./routes/categoryV2Route.js";
import restaurantV2Router from "./routes/restaurantV2Route.js";
import adminAccountRouter from "./routes/adminAccountRoute.js";
import customerRouter from "./routes/customerRoute.js";
import measurementUnitRouter from "./routes/measurementUnitRoute.js";
import droneV2Router from "./routes/droneV2Route.js";
import hubV2Router from "./routes/hubV2Route.js";
import missionV2Router from "./routes/missionV2Route.js";
import { startDroneAssignRetry } from "./jobs/droneAssignmentRetry.js";

// app config
const app = express();
const port = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FastFoodOnline API",
      version: "2.0.0",
      description:
        "REST API documentation for the FastFoodOnline project. Endpoints under /api/v2/* represent the latest version.",
    },
    servers: [
      {
        url: process.env.SWAGGER_BASE_URL || `http://localhost:${port}`,
        description: "Current environment",
      },
    ],
    components: {
      securitySchemes: {
        TokenAuth: {
          type: "apiKey",
          in: "header",
          name: "token",
          description: "JWT token returned by the authentication endpoints.",
        },
      },
    },
    security: [
      {
        TokenAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, "routes", "**", "*.js"),
    path.join(__dirname, "controllers", "**", "*.js"),
    path.join(__dirname, "docs", "**", "*.yaml"),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// middlewares
app.use(express.json());
app.use(cors());
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { explorer: true })
);

// Allow tooling (Postman, etc.) to fetch the raw OpenAPI document.
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// DB connection
connectDB();

// api endpoints
app.use("/api/v2/user", userRouter);
app.use("/api/v2/cart", cartRouter);
app.use("/api/v2/menu", menuV2Router);
app.use("/api/v2/orders", orderV2Router);
app.use("/api/v2/inventory", inventoryV2Router);
app.use("/api/v2/branches", branchV2Router);
app.use("/api/v2/staff", staffV2Router);
app.use("/api/v2/notifications", notificationV2Router);
app.use("/api/v2/categories", categoryV2Router);
app.use("/api/v2/restaurant", restaurantV2Router);
app.use("/api/v2/admins", adminAccountRouter);
app.use("/api/v2/customers", customerRouter);
app.use("/api/v2/units", measurementUnitRouter);
app.use("/api/v2/drones", droneV2Router);
app.use("/api/v2/hubs", hubV2Router);
app.use("/api/v2/missions", missionV2Router);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () => {
  console.log(`Server Started on port: ${port}`);
});

// Background cron: retry drone assignment for confirmed orders
startDroneAssignRetry();
