import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
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
  createOrderDoc,
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

test("integration/orders: manager forbidden other branch; admin allowed", async () => {
  const app = createApp();

  const restaurant = await createRestaurant({ name: "Test Resto" });
  const category = await createCategory({ restaurantId: restaurant._id, name: "Burgers" });
  const branch1 = await createBranch({ restaurantId: restaurant._id, name: "B1" });
  const branch2 = await createBranch({ restaurantId: restaurant._id, name: "B2" });

  const food = await createFood({ categoryId: category._id, name: "Burger" });
  const variant = await createFoodVariant({
    foodId: food._id,
    branchId: branch2._id,
    isActive: true,
  });
  await setInventory({ branchId: branch2._id, foodVariantId: variant._id, quantity: 10 });

  const buyer = await createUser({ email: "buyer@example.com" });
  const order = await createOrderDoc({
    userId: buyer._id,
    branchId: branch2._id,
    foodVariantId: variant._id,
  });

  const manager = await createUser({
    email: "manager@example.com",
    role: "branch_manager",
    branchId: branch1._id,
  });
  const admin = await createUser({ email: "admin@example.com", role: "admin" });

  const managerToken = signTokenForUser(manager._id);
  const adminToken = signTokenForUser(admin._id);

  const denied = await request(app)
    .get(`/api/v2/orders/${order._id}`)
    .set("token", managerToken);
  assert.equal(denied.status, 403);
  assert.equal(denied.body.success, false);

  const allowed = await request(app)
    .get(`/api/v2/orders/${order._id}`)
    .set("token", adminToken);
  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.success, true);
  assert.equal(String(allowed.body.data?._id || allowed.body.data?.id || ""), String(order._id));
});

