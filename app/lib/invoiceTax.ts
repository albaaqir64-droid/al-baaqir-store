import type { OrderItem, OrderRecord } from "./orders";
import { BUSINESS, GSTIN_PATTERN } from "./business";

export type TaxedInvoiceItem = OrderItem & { hsnSac?: string; gstRate: number; grossAmount: number; taxableAmount: number; taxAmount: number; taxMode?: "inclusive" | "exclusive" };
export type InvoiceTaxSummary = { items: TaxedInvoiceItem[]; taxableAmount: number; cgst: number; sgst: number; igst: number; taxAmount: number; total: number; intraState: boolean };

function amount(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100; }

export function calculateInvoiceTax(order: OrderRecord): InvoiceTaxSummary {
  const intraState = GSTIN_PATTERN.test(order.customerGSTIN || "")
    ? order.customerGSTIN!.slice(0, 2) === BUSINESS.stateCode
    : order.shipping.state.trim().toLowerCase() === BUSINESS.stateName.toLowerCase();
  const prices = order.cartItems.map((item) => ({ item, amount: amount(item.price * item.quantity), rate: Math.max(0, Number(item.gstRate ?? 0)) }));
  // Older order snapshots may not contain a tax mode. Infer it only when the
  // recorded payable total uniquely matches one interpretation.
  const inferredModes: Array<"inclusive" | "exclusive" | undefined> = prices.map(({ item, rate }) =>
    item.taxMode === "inclusive" || item.taxMode === "exclusive" ? item.taxMode
      : order.taxMode === "inclusive" || order.taxMode === "exclusive" ? order.taxMode
        : rate === 0 ? "inclusive" : undefined
  );
  const unknownIndexes = inferredModes.flatMap((mode, index) => mode ? [] : [index]);
  // Search mixed interpretations as well as uniform ones. Historical snapshots
  // are resolved only if exactly one combination matches the stored payable.
  if (unknownIndexes.length <= 12) {
    const matches: Array<Array<"inclusive" | "exclusive">> = [];
    for (let mask = 0; mask < 2 ** unknownIndexes.length; mask++) {
      const candidate = [...inferredModes];
      unknownIndexes.forEach((index, bit) => { candidate[index] = mask & (1 << bit) ? "exclusive" : "inclusive"; });
      const expected = amount(prices.reduce((sum, line, index) => sum + (candidate[index] === "exclusive" ? line.amount * (1 + line.rate / 100) : line.amount), 0) - order.discount + order.shippingCharge);
      if (Math.abs(order.total - expected) <= 0.01) matches.push(candidate as Array<"inclusive" | "exclusive">);
      if (matches.length > 1) break;
    }
    if (matches.length === 1) matches[0].forEach((mode, index) => { if (!inferredModes[index]) inferredModes[index] = mode; });
  }
  const items = prices.map(({ item, amount: lineAmount, rate }, index) => {
    const gstRate = rate;
    const taxMode = inferredModes[index];
    if (!gstRate || !taxMode) return { ...item, gstRate, grossAmount: lineAmount, taxableAmount: lineAmount, taxAmount: 0, taxMode };
    if (taxMode === "exclusive") {
      const taxAmount = amount(lineAmount * gstRate / 100);
      return { ...item, gstRate, grossAmount: amount(lineAmount + taxAmount), taxableAmount: lineAmount, taxAmount, taxMode };
    }
    const taxableAmount = amount(lineAmount / (1 + gstRate / 100));
    return { ...item, gstRate, grossAmount: lineAmount, taxableAmount, taxAmount: amount(lineAmount - taxableAmount), taxMode };
  });
  const taxableAmount = amount(items.reduce((sum, item) => sum + item.taxableAmount, 0));
  const taxAmount = amount(items.reduce((sum, item) => sum + item.taxAmount, 0));
  const cgst = intraState ? amount(taxAmount / 2) : 0;
  const sgst = intraState ? amount(taxAmount - cgst) : 0;
  return { items, taxableAmount, taxAmount, cgst, sgst, igst: intraState ? 0 : taxAmount, total: order.total, intraState };
}
