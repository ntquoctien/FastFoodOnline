import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import userModel from "../../models/userModel.js";
import { createApp } from "../../app.js";
import { connectTestDb, cleanupDb, disconnectTestDb } from "../helpers/dbTest.js";

before(async () => {
  await connectTestDb();
});

after(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await cleanupDb();
});

test("integration/cart: add twice increments quantity in DB", async () => {
  const app = createApp();
  const register = await request(app).post("/api/v2/user/register").send({
    name: "Cart User",
    email: "cart@example.com",
    password: "password123",
  });
  assert.equal(register.body.success, true);
  const token = register.body.token;

  const itemId = "item-1";
  await request(app)
    .post("/api/v2/cart/add")
    .set("token", token)
    .send({ itemId });
  await request(app)
    .post("/api/v2/cart/add")
    .set("token", token)
    .send({ itemId });

  const user = await userModel.findOne({ email: "cart@example.com" });
  assert.ok(user);
  assert.equal(user.cartData?.[itemId], 2);
});

