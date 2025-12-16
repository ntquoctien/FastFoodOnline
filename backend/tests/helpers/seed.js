import mongoose from "mongoose";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import userModel from "../../models/userModel.js";
import RestaurantModel from "../../models/v2/restaurantModel.js";
import CategoryModel from "../../models/v2/categoryModel.js";
import BranchModel from "../../models/v2/branchModel.js";
import FoodModel from "../../models/v2/foodModel.js";
import FoodVariantModel from "../../models/v2/foodVariantModel.js";
import InventoryModel from "../../models/v2/inventoryModel.js";
import OrderModel from "../../models/v2/orderModel.js";

const uniq = (prefix) => `${prefix}-${crypto.randomUUID()}`;

export const signTokenForUser = (userId) =>
  jwt.sign({ id: String(userId) }, process.env.JWT_SECRET);

export const createUser = async ({
  name = "Test User",
  email = `user-${crypto.randomUUID()}@example.com`,
  password = "password-not-used",
  role = "user",
  branchId,
} = {}) =>
  userModel.create({
    name,
    email,
    password,
    role,
    ...(branchId ? { branchId: new mongoose.Types.ObjectId(branchId) } : {}),
  });

export const createRestaurant = async ({ name } = {}) =>
  RestaurantModel.create({ name: name ?? uniq("Resto") });

export const createCategory = async ({ restaurantId, name } = {}) =>
  CategoryModel.create({
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    name: name ?? uniq("Cat"),
  });

export const createBranch = async ({
  restaurantId,
  name,
  location = { type: "Point", coordinates: [106.7, 10.7] },
} = {}) =>
  BranchModel.create({
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    name: name ?? uniq("Branch"),
    location,
  });

export const createFood = async ({
  categoryId,
  name,
  isActive = true,
} = {}) =>
  FoodModel.create({
    categoryId: new mongoose.Types.ObjectId(categoryId),
    name: name ?? uniq("Food"),
    isActive,
  });

export const createFoodVariant = async ({
  foodId,
  branchId,
  size = "M",
  price = 5,
  isActive = true,
} = {}) =>
  FoodVariantModel.create({
    foodId: new mongoose.Types.ObjectId(foodId),
    branchId: new mongoose.Types.ObjectId(branchId),
    size,
    price,
    isActive,
  });

export const setInventory = async ({ branchId, foodVariantId, quantity = 10 } = {}) =>
  InventoryModel.findOneAndUpdate(
    {
      branchId: new mongoose.Types.ObjectId(branchId),
      foodVariantId: new mongoose.Types.ObjectId(foodVariantId),
    },
    { $set: { quantity, updatedAt: new Date() } },
    { upsert: true, new: true }
  );

export const createOrderDoc = async ({
  userId,
  branchId,
  foodVariantId,
  quantity = 1,
  totalAmount = 10,
} = {}) =>
  OrderModel.create({
    userId: new mongoose.Types.ObjectId(userId),
    branchId: new mongoose.Types.ObjectId(branchId),
    items: [
      {
        foodVariantId: new mongoose.Types.ObjectId(foodVariantId),
        title: "Test item",
        size: "M",
        quantity,
        unitPrice: totalAmount / quantity,
        totalPrice: totalAmount,
      },
    ],
    customerAddress: { street: "Test", district: "Test", city: "Test" },
    customerLocation: { type: "Point", coordinates: [106.8, 10.8] },
    subtotal: totalAmount,
    deliveryFee: 0,
    totalAmount,
    paymentMethod: "COD",
    paymentStatus: "PAID",
    status: "CREATED",
    timeline: [],
  });

export default {
  signTokenForUser,
  createUser,
  createRestaurant,
  createCategory,
  createBranch,
  createFood,
  createFoodVariant,
  setInventory,
  createOrderDoc,
};
