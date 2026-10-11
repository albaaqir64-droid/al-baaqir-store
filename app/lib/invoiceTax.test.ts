import { strict as assert } from "node:assert";
import { test } from "node:test";
import { calculateInvoiceTax } from "./invoiceTax";
import type { OrderRecord } from "./orders";

function order(overrides: Partial<OrderRecord>): OrderRecord {
  return {
    id: "test", customerName: "", phone: "", paymentMethod: "cod", subtotal: 118,
    shippingCharge: 0, discount: 0, total: 118, status: "pending", createdAt: null,
    lastUpdated: null, invoiceNumber: "", shipping: { name: "", phone: "", address: "", city: "", state: "Other", pincode: "" },
    cartItems: [{ id: "p", name: "Product", price: 118, quantity: 1, image: "", slug: "", gstRate: 18, taxMode: "inclusive" }],
    ...overrides,
  };
}

test("extracts GST from an inclusive price without adding it twice", () => {
  const tax = calculateInvoiceTax(order({}));
  assert.equal(tax.items[0].taxableAmount, 100);
  assert.equal(tax.items[0].taxAmount, 18);
  assert.equal(tax.igst, 18);
  assert.equal(tax.total, 118);
});

test("adds GST to an exclusive price", () => {
  const tax = calculateInvoiceTax(order({
    subtotal: 100,
    total: 118,
    cartItems: [{ id: "p", name: "Product", price: 100, quantity: 1, image: "", slug: "", gstRate: 18, taxMode: "exclusive" }],
  }));
  assert.equal(tax.items[0].taxableAmount, 100);
  assert.equal(tax.items[0].taxAmount, 18);
  assert.equal(tax.items[0].grossAmount, 118);
  assert.equal(tax.total, 118);
});

test("resolves legacy line tax modes independently from the recorded total", () => {
  const tax = calculateInvoiceTax(order({
    total: 236,
    cartItems: [
      { id: "inclusive", name: "Inclusive", price: 118, quantity: 1, image: "", slug: "", gstRate: 18 },
      { id: "exclusive", name: "Exclusive", price: 100, quantity: 1, image: "", slug: "", gstRate: 18 },
    ],
  }));
  assert.deepEqual(tax.items.map((item) => item.taxMode), ["inclusive", "exclusive"]);
  assert.equal(tax.taxableAmount, 200);
  assert.equal(tax.taxAmount, 36);
});

test("does not infer a historical mode when neither interpretation reconciles", () => {
  const tax = calculateInvoiceTax(order({
    total: 110,
    cartItems: [{ id: "p", name: "Product", price: 100, quantity: 1, image: "", slug: "", gstRate: 18 }],
  }));
  assert.equal(tax.items[0].taxMode, undefined);
  assert.equal(tax.items[0].taxAmount, 0);
});
