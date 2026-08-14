import nodemailer from "nodemailer";
import { OrderRecord } from "./orders";
import { format } from "date-fns";
import { BUSINESS } from "./business";

// Email configuration - Update these with your actual email settings
const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};

const STORE_EMAIL = process.env.STORE_EMAIL || BUSINESS.email;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || BUSINESS.email;
const STORE_NAME = BUSINESS.name;

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
}

export async function sendCustomerOrderEmail(
  order: OrderRecord,
  invoiceUrl: string,
  invoiceNumber: string
): Promise<boolean> {
  try {
    if (!order.email?.trim()) {
      console.warn("Customer email is missing. Invoice email was not sent.");
      return false;
    }
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn("Email credentials not configured. Skipping email send.");
      return false;
    }

    const transporter = getTransporter();
    const orderDate = format(order.createdAt?.toDate?.() || new Date(), "dd MMM yyyy");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a3a52; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .header h1 { margin: 0; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .order-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .order-details p { margin: 5px 0; }
            .order-details strong { color: #1a3a52; }
            .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .items-table th { background-color: #1a3a52; color: white; padding: 10px; text-align: left; }
            .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
            .items-table tr:nth-child(even) { background-color: #f5f5f5; }
            .summary { background-color: white; padding: 15px; border-radius: 5px; text-align: right; }
            .summary-row { margin: 8px 0; }
            .total { font-size: 18px; font-weight: bold; color: #1a3a52; }
            .button { background-color: #15b36a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
            .footer { background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .highlight { color: #15b36a; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${STORE_NAME}</h1>
              <p>Order Confirmation</p>
            </div>

            <div class="content">
              <p>Dear ${order.customerName},</p>
              <p>Thank you for your order! We're excited to fulfill your purchase and deliver it to your doorstep.</p>

              <div class="order-details">
                <h3 style="color: #1a3a52; margin-top: 0;">Order Summary</h3>
                <p><strong>Order ID:</strong> <span class="highlight">${order.id}</span></p>
                <p><strong>Invoice Number:</strong> <span class="highlight">${invoiceNumber}</span></p>
                <p><strong>Order Date:</strong> ${orderDate}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                <p><strong>Status:</strong> <span class="highlight">${order.status.toUpperCase()}</span></p>
              </div>

              <h3 style="color: #1a3a52;">Items Ordered</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.cartItems
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.price.toFixed(2)}</td>
                      <td><strong>₹${(item.price * item.quantity).toFixed(2)}</strong></td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <div class="summary">
                <div class="summary-row">Subtotal: <strong>₹${order.subtotal.toFixed(2)}</strong></div>
                <div class="summary-row">Shipping: <strong>₹${order.shippingCharge.toFixed(2)}</strong></div>
                <div class="summary-row total">Total Amount: ₹${order.total.toFixed(2)}</div>
              </div>

              <div class="order-details">
                <h3 style="color: #1a3a52; margin-top: 0;">Shipping Address</h3>
                <p>
                  ${order.shipping.name}<br>
                  ${order.shipping.address}<br>
                  ${order.shipping.city}, ${order.shipping.state} ${order.shipping.pincode}<br>
                  Phone: ${order.shipping.phone}
                </p>
              </div>

              <div style="text-align: center;">
                <a href="${invoiceUrl}" class="button" download>📄 Download Invoice</a>
              </div>

              <div class="order-details">
                <h4 style="color: #1a3a52;">Estimated Delivery</h4>
                <p>Your order will be delivered within 3-5 business days. You'll receive a tracking update once your order ships.</p>
              </div>

              <p style="color: #666;">If you have any questions about your order, please don't hesitate to contact us.</p>
            </div>

            <div class="footer">
              <p><strong>${STORE_NAME}</strong></p>
              <p>Phone/WhatsApp: +91-${BUSINESS.whatsapp} | Email: ${BUSINESS.email}</p>
              <p>&copy; 2024 ${STORE_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"${STORE_NAME}" <${STORE_EMAIL}>`,
      to: order.email.trim(),
      subject: `Order Confirmation - Order #${order.id}`,
      html: htmlContent,
      attachments: invoiceUrl ? [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          path: invoiceUrl,
          contentType: "application/pdf",
        },
      ] : [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Customer email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending customer email:", error);
    return false;
  }
}

export async function sendAdminOrderEmail(order: OrderRecord, invoiceUrl: string): Promise<boolean> {
  try {
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn("Email credentials not configured. Skipping email send.");
      return false;
    }

    const transporter = getTransporter();
    const orderDate = format(order.createdAt?.toDate?.() || new Date(), "dd MMM yyyy HH:mm");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a3a52; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .section { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .section h3 { margin-top: 0; color: #1a3a52; }
            .items-table { width: 100%; border-collapse: collapse; }
            .items-table th { background-color: #e0e0e0; padding: 10px; text-align: left; }
            .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
            .alert { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
            .footer { background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Order Received</h1>
            </div>

            <div class="content">
              <div class="alert">
                <strong>Order #${order.id}</strong> - ${orderDate}
              </div>

              <div class="section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${order.customerName}</p>
                <p><strong>Phone:</strong> ${order.phone}</p>
                <p><strong>Email:</strong> ${order.email || "N/A"}</p>
              </div>

              <div class="section">
                <h3>Shipping Address</h3>
                <p>
                  ${order.shipping.name}<br>
                  ${order.shipping.address}<br>
                  ${order.shipping.city}, ${order.shipping.state} ${order.shipping.pincode}<br>
                  Phone: ${order.shipping.phone}
                </p>
              </div>

              <div class="section">
                <h3>Order Items</h3>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.cartItems
                      .map(
                        (item) => `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>₹${item.price.toFixed(2)}</td>
                        <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>

              <div class="section">
                <h3>Payment Details</h3>
                <p><strong>Subtotal:</strong> ₹${order.subtotal.toFixed(2)}</p>
                <p><strong>Shipping Charge:</strong> ₹${order.shippingCharge.toFixed(2)}</p>
                <p><strong>Total Amount:</strong> <span style="font-size: 18px; color: #15b36a;">₹${order.total.toFixed(2)}</span></p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/orders/${order.id}" 
                   style="background-color: #1a3a52; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  View Order Details
                </a>
                ${invoiceUrl ? `<a href="${invoiceUrl}" style="background-color: #15b36a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-left: 8px;">Download Invoice</a>` : ""}
              </p>
            </div>

            <div class="footer">
              <p>This is an automated notification. Do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"${STORE_NAME}" <${STORE_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `🔔 New Order - ${order.id}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Admin email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending admin email:", error);
    return false;
  }
}

export async function resendInvoiceEmail(order: OrderRecord, invoiceUrl: string, invoiceNumber: string): Promise<boolean> {
  return sendCustomerOrderEmail(order, invoiceUrl, invoiceNumber);
}

export async function verifyEmailConfiguration(): Promise<boolean> {
  try {
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn("Email credentials not configured");
      return false;
    }

    const transporter = getTransporter();
    await transporter.verify();
    console.log("Email configuration verified successfully");
    return true;
  } catch (error) {
    console.error("Email configuration error:", error);
    return false;
  }
}
