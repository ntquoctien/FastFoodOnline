import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import OrderModel from "../../models/v2/orderModel.js";
import { createApp } from "../../app.js";
import { connectTestDb, cleanupDb, disconnectTestDb } from "../helpers/dbTest.js";
import { applyTestEnv } from "../helpers/testEnv.js";
import {
  createUser,
  signTokenForUser,
  createRestaurant,
  createCategory,
  createBranch,
  createFood,
  createFoodVariant,
  setInventory,
} from "../helpers/seed.js";

before(async () => {
  applyTestEnv();
  await connectTestDb();
});

after(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await cleanupDb();
});

test("integration/orders: inactive item rejected", async () => {
  const app = createApp();

  const user = await createUser({ email: "order@example.com" });
  const token = signTokenForUser(user._id);

  const restaurant = await createRestaurant({ name: "Test Resto" });
  const category = await createCategory({
    restaurantId: restaurant._id,
    name: "Burgers",
  });
  const branch = await createBranch({ restaurantId: restaurant._id, name: "B1" });
  const food = await createFood({ categoryId: category._id, name: "Burger" });
  const variant = await createFoodVariant({
    foodId: food._id,
    branchId: branch._id,
    isActive: false,
  });
  await setInventory({ branchId: branch._id, foodVariantId: variant._id, quantity: 10 });

  const res = await request(app)
    .post("/api/v2/orders")
    .set("token", token)
    .send({
      branchId: String(branch._id),
      items: [{ variantId: String(variant._id), quantity: 1 }],
      customerLocation: { type: "Point", coordinates: [106.8, 10.5] },
      customerAddress: { street: "Test", district: "Test", city: "Test" },
      paymentMethod: "COD",
    });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Item is inactive");

  const count = await OrderModel.countDocuments({});
  assert.equal(count, 0);
});

