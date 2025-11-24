import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as orderService from "../../services/v2/orderService.js";
import * as droneService from "../../services/v2/droneService.js";
import * as droneAssignmentRepo from "../../repositories/v2/droneAssignmentRepository.js";
import * as droneRepo from "../../repositories/v2/droneRepository.js";
import RestaurantModel from "../../models/v2/restaurantModel.js";
import BranchModel from "../../models/v2/branchModel.js";
import CategoryModel from "../../models/v2/categoryModel.js";
import FoodModel from "../../models/v2/foodModel.js";
import FoodVariantModel from "../../models/v2/foodVariantModel.js";
import userModel from "../../models/userModel.js";

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

after(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

const createFixtures = async () => {
  const restaurant = await RestaurantModel.create({ name: "Test Resto" });
  const branch = await BranchModel.create({
    restaurantId: restaurant._id,
    name: "Main",
    latitude: 10.0,
    longitude: 106.0,
  });
  const user = await userModel.create({
    name: "Alice",
    email: "alice@example.com",
    password: "secret",
    role: "user",
  });
  const admin = await userModel.create({
    name: "Admin",
    email: "admin@example.com",
    password: "secret",
    role: "admin",
  });
  const category = await CategoryModel.create({
    restaurantId: restaurant._id,
    name: "Burgers",
  });
  const food = await FoodModel.create({
    categoryId: category._id,
    name: "Burger",
    description: "Tasty",
  });
  const variant = await FoodVariantModel.create({
    foodId: food._id,
    branchId: branch._id,
    size: "M",
    price: 5,
    isActive: true,
  });
  const drone = await droneRepo.create({
    code: "DRN-TEST-1",
    branchId: branch._id,
    status: "available",
    batteryLevel: 100,
    maxPayloadKg: 3,
  });
  return { restaurant, branch, user, admin, variant, drone };
};

test("create → pay → assign → delivered (drone)", async () => {
  const { branch, user, variant, drone } = await createFixtures();

  const createResult = await orderService.createOrder({
    userId: user._id,
    branchId: branch._id,
    items: [{ variantId: variant._id, quantity: 2 }],
    address: "123 Test St",
    dropoffLat: 10.5,
    dropoffLng: 106.8,
  });
  assert.equal(createResult.success, true, createResult.message);
  const orderId = createResult.data._id;

  const payResult = await orderService.confirmPayment({
    orderId,
    provider: "stripe",
    transactionId: "tx-1",
    amount: 12,
  });
  assert.equal(payResult.success, true);

  const assignment = await droneAssignmentRepo.findByOrderId(orderId);
  assert.ok(assignment);
  assert.equal(assignment.status, "assigned");

  await droneService.handleDroneStatusEvent({
    orderId,
    droneId: drone._id,
    status: "en_route_dropoff",
  });
  await droneService.handleDroneStatusEvent({
    orderId,
    droneId: drone._id,
    status: "delivered",
  });

  const updatedAssignment = await droneAssignmentRepo.findByOrderId(orderId);
  assert.equal(updatedAssignment.status, "delivered");
  const updatedDrone = await droneRepo.findById(drone._id);
  assert.equal(updatedDrone.status, "available");
});

test("geocode fail returns error when no coords", async () => {
  const { branch, user, variant } = await createFixtures();
  const originalBase = process.env.GEOCODER_BASE_URL;
  process.env.GEOCODER_BASE_URL = "http://localhost:0";

  const result = await orderService.createOrder({
    userId: user._id,
    branchId: branch._id,
    items: [{ variantId: variant._id, quantity: 1 }],
    address: "Unknown place",
  });

  process.env.GEOCODER_BASE_URL = originalBase;
  assert.equal(result.success, false);
});

test("cancel order releases drone", async () => {
  const { branch, user, admin, variant, drone } = await createFixtures();
  const { data: order } = await orderService.createOrder({
    userId: user._id,
    branchId: branch._id,
    items: [{ variantId: variant._id, quantity: 1 }],
    address: "123 Test St",
    dropoffLat: 10.5,
    dropoffLng: 106.8,
  });
  await orderService.confirmPayment({
    orderId: order._id,
    provider: "stripe",
    transactionId: "tx-2",
  });

  const cancelResult = await orderService.cancelOrder({
    orderId: order._id,
    userId: user._id,
    reason: "Changed mind",
  });
  assert.equal(cancelResult.success, true);
  const assignment = await droneAssignmentRepo.findByOrderId(order._id);
  assert.equal(assignment.status, "cancelled");
  const updatedDrone = await droneRepo.findById(drone._id);
  assert.equal(updatedDrone.status, "available");

  // Non-admin cannot skip states
  const statusJump = await orderService.updateStatus({
    orderId: order._id,
    status: "in_transit",
    actorId: user._id,
    role: "staff",
    branchId: branch._id,
  });
  assert.equal(statusJump.success, false);
});
