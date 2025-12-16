import { test } from "node:test";
import assert from "node:assert/strict";
import { canAccessBranchOrder } from "../../services/v2/orderService.js";

test("unit/rbac: manager denied other branch; admin allowed", () => {
  assert.equal(
    canAccessBranchOrder({
      role: "branch_manager",
      actorBranchId: "B1",
      orderBranchId: "B2",
    }),
    false
  );

  assert.equal(
    canAccessBranchOrder({
      role: "admin",
      actorBranchId: "B1",
      orderBranchId: "B2",
    }),
    true
  );
});

