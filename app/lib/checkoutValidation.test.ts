import { strict as assert } from "node:assert";
import { test } from "node:test";
import { getCheckoutValidationErrors } from "./checkoutValidation";

const validForm = {
  fullName: "Test Customer", mobile: "9876543210", email: "", customerGSTIN: "",
  house: "12", street: "Main Road", pincode: "110001", city: "New Delhi", state: "Delhi",
};

test("checkout accepts city and state entered manually when pincode lookup fails", () => {
  assert.deepEqual(getCheckoutValidationErrors(validForm, 1), {});
});

test("checkout reports missing city and state instead of silently blocking submission", () => {
  const errors = getCheckoutValidationErrors({ ...validForm, city: "", state: "" }, 1);
  assert.equal(errors.city, "City is required.");
  assert.equal(errors.state, "State is required.");
});

test("checkout reports invalid required fields and empty cart", () => {
  const errors = getCheckoutValidationErrors({ ...validForm, mobile: "123", pincode: "123" }, 0);
  assert.equal(errors.mobile, "Enter a valid 10-digit mobile number.");
  assert.equal(errors.pincode, "Enter a valid 6-digit pincode.");
  assert.equal(errors.cart, "Your cart is empty. Add items before placing an order.");
});
