import { PDFDocument, rgb, PDFPage } from "pdf-lib";
import { OrderRecord } from "./orders";
import { format } from "date-fns";

export interface InvoiceData {
  order: OrderRecord;
  storeName: string;
  storeGST?: string;
  storeLogo?: string;
}

const STORE_DETAILS = {
  name: "Al Baaqir",
  gst: "18AAPFU5055K1Z0",
  phone: "+91-XXXXXXXXXX",
  email: "contact@albaaqir.com",
  address: "Your Store Address",
};

async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  const { order, storeName } = invoiceData;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  const margin = 40;
  const contentWidth = width - 2 * margin;
  let yPosition = height - margin;

  // Color scheme
  const primaryColor = rgb(0.2, 0.3, 0.5); // Dark blue
  const secondaryColor = rgb(0.6, 0.6, 0.6); // Gray
  const accentColor = rgb(0.15, 0.6, 0.3); // Green

  // Helper function to draw text
  const drawText = (
    text: string,
    x: number,
    y: number,
    size: number,
    color = rgb(0, 0, 0),
    fontName = "Helvetica"
  ) => {
    page.drawText(text, {
      x,
      y,
      size,
      color,
      font: pdfDoc.getFont(fontName),
    });
  };

  // Helper to draw section divider
  const drawDivider = (y: number) => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: secondaryColor,
    });
  };

  // Header - Store Name and Invoice Type
  drawText(storeName.toUpperCase(), margin, yPosition, 24, primaryColor, "Helvetica-Bold");
  yPosition -= 30;

  drawText("INVOICE", width - margin - 70, yPosition, 14, accentColor, "Helvetica-Bold");
  yPosition -= 20;

  // Invoice Details Header
  drawText(`Invoice #: ${order.invoiceNumber}`, margin, yPosition, 10, secondaryColor);
  drawText(`Date: ${format(order.createdAt?.toDate?.() || new Date(), "dd MMM yyyy")}`, margin, yPosition - 15, 10, secondaryColor);
  drawText(`Order ID: ${order.id}`, margin, yPosition - 30, 10, secondaryColor);

  yPosition -= 50;
  drawDivider(yPosition);
  yPosition -= 15;

  // Store Details - Left Column
  drawText("FROM:", margin, yPosition, 10, primaryColor, "Helvetica-Bold");
  yPosition -= 12;
  drawText(storeName, margin, yPosition, 10);
  drawText(`GST: ${STORE_DETAILS.gst}`, margin, yPosition - 12, 9, secondaryColor);
  drawText(`Phone: ${STORE_DETAILS.phone}`, margin, yPosition - 22, 9, secondaryColor);
  drawText(`Email: ${STORE_DETAILS.email}`, margin, yPosition - 32, 9, secondaryColor);

  // Customer Details - Right Column
  const rightColumnX = margin + contentWidth / 2 + 20;
  drawText("BILL TO:", rightColumnX, yPosition, 10, primaryColor, "Helvetica-Bold");
  yPosition -= 12;
  drawText(order.customerName, rightColumnX, yPosition, 10);
  drawText(`Phone: ${order.phone}`, rightColumnX, yPosition - 12, 9, secondaryColor);
  drawText(`Email: ${order.email || "N/A"}`, rightColumnX, yPosition - 22, 9, secondaryColor);

  yPosition -= 50;
  drawText("SHIPPING ADDRESS:", margin, yPosition, 10, primaryColor, "Helvetica-Bold");
  yPosition -= 12;
  drawText(order.shipping.name, margin, yPosition, 9);
  drawText(order.shipping.address, margin, yPosition - 11, 9);
  drawText(`${order.shipping.city}, ${order.shipping.state} ${order.shipping.pincode}`, margin, yPosition - 22, 9);
  drawText(`Phone: ${order.shipping.phone}`, margin, yPosition - 33, 9, secondaryColor);

  yPosition -= 50;
  drawDivider(yPosition);
  yPosition -= 15;

  // Items Table Header
  const colX = [margin, margin + 250, margin + 320, margin + 380, margin + 450];
  drawText("Description", colX[0], yPosition, 10, rgb(1, 1, 1), "Helvetica-Bold");
  drawText("Qty", colX[2], yPosition, 10, rgb(1, 1, 1), "Helvetica-Bold");
  drawText("Price", colX[3], yPosition, 10, rgb(1, 1, 1), "Helvetica-Bold");
  drawText("Total", colX[4], yPosition, 10, rgb(1, 1, 1), "Helvetica-Bold");

  page.drawRectangle({
    x: margin,
    y: yPosition - 5,
    width: contentWidth,
    height: 20,
    color: primaryColor,
  });

  // Redraw header text in white
  drawText("Description", colX[0], yPosition, 10, rgb(1, 1, 1), "Helvetica-Bold");
  drawText("Qty", colX[2], yPosition, 10, rgb(1, 1, 1), "Helvetica-Bold");
  drawText("Price", colX[3], yPosition, 10, rgb(1, 1, 1), "Helvetica-Bold");
  drawText("Total", colX[4], yPosition, 10, rgb(1, 1, 1), "Helvetica-Bold");

  yPosition -= 25;

  // Items
  order.cartItems.forEach((item) => {
    const itemTotal = item.price * item.quantity;

    drawText(item.name.substring(0, 30), colX[0], yPosition, 9);
    drawText(String(item.quantity), colX[2], yPosition, 9);
    drawText(`₹${item.price.toFixed(2)}`, colX[3], yPosition, 9);
    drawText(`₹${itemTotal.toFixed(2)}`, colX[4], yPosition, 9);

    yPosition -= 15;
  });

  yPosition -= 10;
  drawDivider(yPosition);
  yPosition -= 15;

  // Totals Section
  const totalX = margin + contentWidth - 180;

  drawText("Subtotal:", totalX, yPosition, 10);
  drawText(`₹${order.subtotal.toFixed(2)}`, totalX + 120, yPosition, 10, rgb(0, 0, 0), "Helvetica-Bold");

  yPosition -= 15;
  drawText("Shipping:", totalX, yPosition, 10);
  drawText(`₹${order.shippingCharge.toFixed(2)}`, totalX + 120, yPosition, 10);

  yPosition -= 20;
  drawText("TOTAL:", totalX, yPosition, 11, accentColor, "Helvetica-Bold");
  drawText(`₹${order.total.toFixed(2)}`, totalX + 120, yPosition, 11, accentColor, "Helvetica-Bold");

  yPosition -= 30;
  drawDivider(yPosition);
  yPosition -= 15;

  // Payment Info
  drawText("Payment Method:", margin, yPosition, 10, primaryColor, "Helvetica-Bold");
  drawText(order.paymentMethod.toUpperCase(), margin + 120, yPosition, 10);

  // Order Status
  yPosition -= 18;
  drawText("Order Status:", margin, yPosition, 10, primaryColor, "Helvetica-Bold");
  drawText(order.status.toUpperCase(), margin + 120, yPosition, 10, accentColor, "Helvetica-Bold");

  // Thank You Message
  yPosition -= 40;
  drawText("Thank you for your purchase!", margin, yPosition, 11, primaryColor, "Helvetica-Bold");
  yPosition -= 15;
  drawText("We appreciate your business and look forward to serving you again.", margin, yPosition, 9, secondaryColor);

  // Footer
  yPosition -= 30;
  drawDivider(yPosition);
  yPosition -= 12;
  const footerText = `Generated on ${format(new Date(), "dd MMM yyyy HH:mm")}`;
  const footerWidth = footerText.length * 3;
  drawText(footerText, width / 2 - footerWidth / 2, yPosition, 8, secondaryColor);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function uploadInvoiceToFirebase(
  invoiceBuffer: Buffer,
  orderId: string,
  invoiceNumber: string
): Promise<string> {
  // This will be called from API route using Firebase Admin SDK
  // Returns the download URL
  const filename = `invoices/${orderId}/${invoiceNumber}.pdf`;
  return filename; // Placeholder - actual implementation in API route
}
