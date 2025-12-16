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

test("integration/user: POST register creates user in DB", async () => {
  const app = createApp();
  const payload = {
    name: "Alice",
    email: "alice@example.com",
    password: "password123",
  };

  const res = await request(app).post("/api/v2/user/register").send(payload);
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.token);

  const created = await userModel.findOne({ email: payload.email });
  assert.ok(created);
  assert.equal(created.name, payload.name);
});

