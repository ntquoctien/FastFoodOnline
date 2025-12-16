import { test } from "node:test";
import assert from "node:assert/strict";
import { incrementCartItem } from "../../services/cartService.js";

test("unit/cart: existing item increments quantity", () => {
  const initial = { itemA: 1 };
  const next = incrementCartItem(initial, "itemA");
  assert.deepEqual(initial, { itemA: 1 });
  assert.deepEqual(next, { itemA: 2 });
});

