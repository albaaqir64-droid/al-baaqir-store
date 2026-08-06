import { NextRequest, NextResponse } from "next/server";
import { generateInvoicePDF } from "@/app/lib/invoice";
import { sendCustomerOrderEmail, sendAdminOrderEmail } from "@/app/lib/email";
import { fetchOrderById } from "@/app/lib/orders";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin if not already initialized
let adminApp: any = null;

function getAdminApp() {
  if (adminApp) return adminApp;

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
    authUri: "https://accounts.google.com/o/oauth2/auth",
    tokenUri: "https://oauth2.googleapis.com/token",
    authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
    clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };

  adminApp = initializeApp({
    credential: cert(serviceAccount as any),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  return adminApp;
}

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Get order from Firestore
    const order = await fetchOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Generate Invoice Number if not exists
    let invoiceNumber = order.invoiceNumber;
    if (!invoiceNumber) {
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      invoiceNumber = `INV-${datePrefix}-${orderId.slice(-6).toUpperCase()}`;
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      order: { ...order, invoiceNumber },
      storeName: "Al Baaqir",
      storeGST: "18AAPFU5055K1Z0",
    });

    // Upload to Firebase Storage
    const adminApp = getAdminApp();
    const bucket = getStorage(adminApp).bucket();
    const filename = `invoices/${orderId}/${invoiceNumber}.pdf`;
    const file = bucket.file(filename);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: "application/pdf",
      },
    });

    // Get download URL
    const [downloadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Update order with invoice number and URL in Firestore
    const db = getFirestore(adminApp);
    await db.collection("orders").doc(orderId).update({
      invoiceNumber,
      invoiceUrl: downloadUrl,
      invoiceGeneratedAt: new Date(),
    });

    // Send emails
    const customerEmailSent = await sendCustomerOrderEmail(
      { ...order, invoiceNumber },
      downloadUrl,
      invoiceNumber
    );

    const adminEmailSent = await sendAdminOrderEmail(
      { ...order, invoiceNumber },
      downloadUrl
    );

    return NextResponse.json({
      success: true,
      invoiceNumber,
      invoiceUrl: downloadUrl,
      customerEmailSent,
      adminEmailSent,
      message: "Invoice generated and emails sent successfully",
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice", details: String(error) },
      { status: 500 }
    );
  }
}
