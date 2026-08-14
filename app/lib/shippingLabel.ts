import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { OrderRecord } from "./orders";
import { BUSINESS } from "./business";

export async function generateShippingLabelPDF(order: OrderRecord): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([288, 432]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  let y = height - 28;
  const text = (value: string, x: number, size = 10, strong = false) => {
    page.drawText(value, { x, y, size, font: strong ? bold : regular, color: rgb(0, 0, 0) });
  };
  const rule = () => {
    page.drawLine({ start: { x: 18, y }, end: { x: width - 18, y }, thickness: 1, color: rgb(0.55, 0.55, 0.55) });
    y -= 16;
  };

  text("AL BAAQIR", 18, 17, true);
  y -= 20;
  text("SHIPPING LABEL", 18, 10, true);
  text(`Order: ${order.invoiceNumber || order.id}`, 145, 8);
  y -= 16;
  rule();
  text("FROM", 18, 10, true);
  y -= 14;
  text(BUSINESS.name, 18, 10, true);
  y -= 13;
  text(`GSTIN: ${BUSINESS.gstin}`, 18, 9);
  y -= 12;
  text(`Phone/WhatsApp: ${BUSINESS.whatsapp}`, 18, 9);
  y -= 12;
  text(`Email: ${BUSINESS.email}`, 18, 9);
  y -= 17;
  rule();
  text("SHIP TO", 18, 10, true);
  y -= 15;
  text(order.shipping.name || order.customerName, 18, 12, true);
  y -= 16;
  for (const line of [order.shipping.address, `${order.shipping.city}, ${order.shipping.state}`, order.shipping.pincode ? `PIN: ${order.shipping.pincode}` : "", `Phone: ${order.shipping.phone || order.phone}`].filter(Boolean)) {
    text(line.slice(0, 52), 18, 10);
    y -= 14;
  }
  y -= 4;
  rule();
  text("ITEMS", 18, 10, true);
  y -= 14;
  for (const item of order.cartItems.slice(0, 8)) {
    text(`${item.quantity} x ${item.name}`.slice(0, 48), 18, 9);
    y -= 12;
  }
  y -= 6;
  text(`COD/Order total: INR ${order.total.toFixed(2)}`, 18, 10, true);
  return Buffer.from(await pdf.save());
}
