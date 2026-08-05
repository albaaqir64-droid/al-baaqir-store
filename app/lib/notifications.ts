import type { OrderRecord } from "./orders";

export function buildAdminWhatsAppMessage(order: OrderRecord): string {
  const items = order.cartItems
    .map((item) => `${item.name} x${item.quantity}`)
    .join(" | ");

  return `New order received!\nOrder: ${order.invoiceNumber}\nCustomer: ${order.customerName}\nPhone: ${order.phone}\nTotal: ₹${order.total}\nPayment: ${order.paymentMethod}\nShipping: ${order.shipping.address}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.pincode}\nItems: ${items}`;
}

export function buildCustomerWhatsAppMessage(order: OrderRecord): string {
  return `Hello ${order.customerName}! Your order ${order.invoiceNumber} has been placed successfully. Total: ₹${order.total}. We will deliver to ${order.shipping.address}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.pincode}. Thank you for shopping with us!`;
}
