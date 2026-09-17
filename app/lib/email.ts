import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface ContactInquiry {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function sendContactInquiryEmail(data: ContactInquiry) {
  const { name, email, phone, message } = data;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'baaqirlifestyle@gmail.com',
    subject: `New Customer Inquiry - ${name}`,
    html: `<h2>New Inquiry from ${name}</h2><p>Email: ${email}</p><p>Phone: ${phone || 'N/A'}</p><p>Message: ${message}</p>`,
  };
  return transporter.sendMail(mailOptions);
}

// Exactly 3 arguments as required by generate/route.ts
export async function sendCustomerOrderEmail(orderData: any, invoiceUrl: string, invoiceNumber: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: orderData.email,
    subject: `Your Al Baaqir Order - ${invoiceNumber}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h1>Thank you for your order, ${orderData.name}!</h1>
        <p>Your order <b>${invoiceNumber}</b> has been received.</p>
        <p>Download your invoice: <a href="${invoiceUrl}">Invoice PDF</a></p>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
}

// Exactly 2 arguments as required by generate/route.ts
export async function sendAdminOrderEmail(orderData: any, invoiceUrl: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'baaqirlifestyle@gmail.com',
    subject: `New Order Alert - ${orderData.invoiceNumber || orderData.id}`,
    html: `<h1>New Order Received</h1><p>Customer: ${orderData.name}</p><p>Total: ₹${orderData.total}</p><p><a href="${invoiceUrl}">View Invoice</a></p>`,
  };
  return transporter.sendMail(mailOptions);
}

// Exactly 3 arguments as required by resend/route.ts
export async function resendInvoiceEmail(orderData: any, invoiceUrl: string, invoiceNumber: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: orderData.email,
    subject: `Invoice Copy - ${invoiceNumber}`,
    html: `<p>Hello ${orderData.name}, here is the copy of your invoice: <a href="${invoiceUrl}">Download PDF</a></p>`,
  };
  return transporter.sendMail(mailOptions);
}
