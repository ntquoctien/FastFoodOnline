import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import RestaurantModel from "../models/v2/restaurantModel.js";
import BranchModel from "../models/v2/branchModel.js";
import CategoryModel from "../models/v2/categoryModel.js";
import FoodModel from "../models/v2/foodModel.js";
import FoodVariantModel from "../models/v2/foodVariantModel.js";
import ShipperProfileModel from "../models/v2/shipperProfileModel.js";
import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const dropLegacyCollections = async () => {
  const legacyCollections = [
    "restaurants",
    "branches",
    "categories",
    "foods",
    "foodvariants",
    "inventory",
    "orders",
    "shipperprofiles",
    "deliveryassignments",
    "payments",
  ];

  await Promise.all(
    legacyCollections.map(async (name) => {
      try {
        await mongoose.connection.db.dropCollection(name);
        console.log(`Dropped legacy collection: ${name}`);
      } catch (error) {
        if (error.codeName !== "NamespaceNotFound") {
          console.warn(`Could not drop ${name}:`, error.message);
        }
      }
    })
  );
};

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to MongoDB");

  await dropLegacyCollections();

  await Promise.all([
    RestaurantModel.deleteMany({}),
    BranchModel.deleteMany({}),
    CategoryModel.deleteMany({}),
    FoodModel.deleteMany({}),
    FoodVariantModel.deleteMany({}),
  ]);

  const restaurant = await RestaurantModel.create({
    name: "Tomato Express",
    description: "Fast casual food chain",
    phone: "+1 555-1000",
    email: "info@tomatoexpress.com",
    cuisine: "International",
  });

  const [centralBranch, downtownBranch] = await BranchModel.insertMany([
    {
      restaurantId: restaurant._id,
      name: "Central Kitchen",
      street: "123 Main St",
      district: "Central",
      city: "Metropolis",
      phone: "+1 555-1100",
      isPrimary: true,
    },
    {
      restaurantId: restaurant._id,
      name: "Downtown Hub",
      street: "456 Downtown Ave",
      district: "Downtown",
      city: "Metropolis",
      phone: "+1 555-1200",
    },
  ]);

  const [pizzaCategory, drinksCategory] = await CategoryModel.insertMany([
    {
      restaurantId: restaurant._id,
      name: "Pizza",
      description: "Wood-fired pizzas in multiple sizes",
    },
    {
      restaurantId: restaurant._id,
      name: "Beverages",
      description: "Soft drinks and juices",
    },
  ]);

  const [margherita, pepperoni, lemonade] = await FoodModel.insertMany([
    {
      categoryId: pizzaCategory._id,
      name: "Margherita Pizza",
      description: "Classic tomato, mozzarella & basil",
      imageUrl: "",
    },
    {
      categoryId: pizzaCategory._id,
      name: "Pepperoni Pizza",
      description: "Pepperoni with mozzarella",
      imageUrl: "",
    },
    {
      categoryId: drinksCategory._id,
      name: "Lemonade",
      description: "Freshly squeezed lemon juice",
      imageUrl: "",
    },
  ]);

  await FoodVariantModel.insertMany([
    {
      foodId: margherita._id,
      branchId: centralBranch._id,
      size: "S",
      price: 8,
      isDefault: true,
    },
    {
      foodId: margherita._id,
      branchId: centralBranch._id,
      size: "M",
      price: 10,
    },
    {
      foodId: margherita._id,
      branchId: downtownBranch._id,
      size: "L",
      price: 12,
    },
    {
      foodId: pepperoni._id,
      branchId: centralBranch._id,
      size: "M",
      price: 11,
      isDefault: true,
    },
    {
      foodId: pepperoni._id,
      branchId: centralBranch._id,
      size: "L",
      price: 13.5,
    },
    {
      foodId: lemonade._id,
      branchId: centralBranch._id,
      size: "Regular",
      price: 3,
      isDefault: true,
    },
  ]);

  const saltRounds = Number(process.env.SALT || 10);
  const buildHash = async (plain) =>
    bcrypt.hash(plain, await bcrypt.genSalt(saltRounds));

  const admin = await userModel.findOneAndUpdate(
    { email: "admin@example.com" },
    {
      name: "Platform Admin",
      password: await buildHash("admin1234"),
      role: "admin",
      isActive: true,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const branchManager = await userModel.findOneAndUpdate(
    { email: "branch.manager@example.com" },
    {
      name: "Central Branch Manager",
      password: await buildHash("branch1234"),
      role: "branch_manager",
      branchId: centralBranch._id,
      staffStatus: "active",
      isActive: true,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const customer = await userModel.findOneAndUpdate(
    { email: "customer@example.com" },
    {
      name: "Sample Customer",
      password: await buildHash("user1234"),
      role: "user",
      isActive: true,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const shipperUser = await userModel.findOneAndUpdate(
    { email: "drone.pilot@example.com" },
    {
      name: "Drone Pilot",
      password: await buildHash("drone1234"),
      role: "staff",
      branchId: centralBranch._id,
      staffStatus: "active",
      isActive: true,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await ShipperProfileModel.deleteMany({});
  if (shipperUser) {
    await ShipperProfileModel.create({
      userId: shipperUser._id,
      branchId: centralBranch._id,
      vehicleType: "drone",
      licensePlate: "DRONE-01",
      status: "available",
    });
  } else {
    console.warn("Failed to seed shipper profile because shipper user missing");
  }

  if (!admin) {
    console.warn("Admin account was not created during seeding");
  }

  console.log("Seeded v2 data successfully");
};

seed()
  .catch((error) => {
    console.error("Seed v2 failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
