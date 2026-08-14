import type { OrderItem, OrderRecord } from "./orders";
import { BUSINESS, GSTIN_PATTERN } from "./business";

export type TaxedInvoiceItem = OrderItem & { hsnSac?: string; gstRate: number; grossAmount: number; taxableAmount: number; taxAmount: number };
export type InvoiceTaxSummary = { items: TaxedInvoiceItem[]; taxableAmount: number; cgst: number; sgst: number; igst: number; taxAmount: number; total: number; intraState: boolean };

function amount(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100; }

export function calculateInvoiceTax(order: OrderRecord): InvoiceTaxSummary {
  const intraState = GSTIN_PATTERN.test(order.customerGSTIN || "")
    ? order.customerGSTIN!.slice(0, 2) === BUSINESS.stateCode
    : order.shipping.state.trim().toLowerCase() === BUSINESS.stateName.toLowerCase();
  const items = order.cartItems.map((item) => {
    const grossAmount = amount(item.price * item.quantity);
    const gstRate = Math.max(0, Number(item.gstRate ?? 0));
    // Product prices are tax-inclusive: derive tax from the gross line amount.
    const taxableAmount = gstRate ? amount(grossAmount * 100 / (100 + gstRate)) : grossAmount;
    return { ...item, gstRate, grossAmount, taxableAmount, taxAmount: amount(grossAmount - taxableAmount) };
  });
  const taxableAmount = amount(items.reduce((sum, item) => sum + item.taxableAmount, 0));
  const taxAmount = amount(items.reduce((sum, item) => sum + item.taxAmount, 0));
  return { items, taxableAmount, taxAmount, cgst: intraState ? amount(taxAmount / 2) : 0, sgst: intraState ? amount(taxAmount / 2) : 0, igst: intraState ? 0 : taxAmount, total: order.total, intraState };
}
