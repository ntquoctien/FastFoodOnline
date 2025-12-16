import { test } from "node:test";
import assert from "node:assert/strict";
import { validateOrderLineAvailability } from "../../services/v2/orderService.js";

test("unit/order: inactive or out-of-stock rejected", () => {
  const inactive = validateOrderLineAvailability({
    variant: { isActive: false, foodId: { isActive: true } },
    availableQuantity: 100,
    requestedQuantity: 1,
  });
  assert.equal(inactive.ok, false);
  assert.equal(inactive.code, "ITEM_INACTIVE");

  const outOfStock = validateOrderLineAvailability({
    variant: { isActive: true, foodId: { isActive: true } },
    availableQuantity: 0,
    requestedQuantity: 1,
  });
  assert.equal(outOfStock.ok, false);
  assert.equal(outOfStock.code, "OUT_OF_STOCK");
});

