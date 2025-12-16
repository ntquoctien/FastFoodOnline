import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRegistrationInput } from "../../services/userService.js";

test("unit/register: short password rejected", () => {
  const result = validateRegistrationInput({
    email: "tester@example.com",
    password: "short",
  });
  assert.equal(result.success, false);
  assert.equal(result.message, "Please enter strong password");
});

