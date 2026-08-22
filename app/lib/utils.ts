/**
 * Formats a number as INR currency safely.
 * This prevents UTF-8 encoding issues like 'â¹' by using the native Intl API.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Strips markdown-like characters and malformed tags to ensure clean rendering.
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[#*`_~]/g, "") // Remove markdown syntax
    .replace(/<[^>]*>?/gm, "") // Remove HTML tags
    .trim();
}

/**
 * Groups raw categories into primary navigation buckets.
 */
export const NAVIGATION_GROUPS = [
  {
    label: "Men",
    categories: ["Men", "Shirts", "T-Shirts", "Jeans", "Karachi Suit"],
  },
  {
    label: "Women",
    categories: ["Women", "Kurti", "Earrings", "Jhumka"],
  },
  {
    label: "Accessories",
    categories: ["Belts", "Bags"],
  },
  {
    label: "New Arrivals",
    href: "/new-arrivals",
  },
];
