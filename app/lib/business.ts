/**
 * Canonical seller identity. Deployment environment variables can override these
 * values, but invoices, labels, and mail must always read from this one source.
 */
export const BUSINESS = {
  name: "Al Baaqir",
  gstin: process.env.BUSINESS_SELLER_GSTIN || "07BLRPN3359N1Z8",
  email: process.env.BUSINESS_EMAIL || "albaaqir64@gmail.com",
  phone: process.env.BUSINESS_PHONE || "7041396464",
  whatsapp: process.env.BUSINESS_WHATSAPP || process.env.BUSINESS_PHONE || "7041396464",
  stateCode: (process.env.BUSINESS_SELLER_GSTIN || "07BLRPN3359N1Z8").slice(0, 2),
  stateName: "Delhi",
} as const;

export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
