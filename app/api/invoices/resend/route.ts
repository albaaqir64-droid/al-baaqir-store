import { NextRequest, NextResponse } from "next/server";
import { resendInvoiceEmail } from "@/app/lib/email";
import { getOrder } from "@/app/lib/orders";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Get order from Firestore
    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.invoiceNumber || !order.invoiceUrl) {
      return NextResponse.json(
        { error: "Invoice not found for this order. Please generate invoice first." },
        { status: 400 }
      );
    }

    if (!order.email) {
      return NextResponse.json(
        { error: "Customer email not found" },
        { status: 400 }
      );
    }

    // Resend invoice email
    const emailSent = await resendInvoiceEmail(
      order,
      order.invoiceUrl!,
      order.invoiceNumber
    );

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: "Invoice email resent successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Failed to send invoice email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error resending invoice:", error);
    return NextResponse.json(
      { error: "Failed to resend invoice email", details: String(error) },
      { status: 500 }
    );
  }
}
