import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '../../../../app/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { sanitizeCartItems, sanitizeShipping } from '../../../../app/lib/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderMeta } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return NextResponse.json({ error: 'Razorpay secret not configured' }, { status: 500 });

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const safeOrderMeta = typeof orderMeta === 'object' && orderMeta ? orderMeta : {};
    const orderItems = sanitizeCartItems(safeOrderMeta.cartItems);
    const shipping = sanitizeShipping(safeOrderMeta.shipping);

    if (!orderItems.length) {
      return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 });
    }

    // Generate invoice number
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const invoiceNumber = `INV-${datePrefix}-${randomSuffix}`;

    const orderToSave = {
      customerName: String(safeOrderMeta.customerName ?? ""),
      phone: String(safeOrderMeta.phone ?? ""),
      email: String(safeOrderMeta.email ?? ""),
      paymentMethod: String(safeOrderMeta.paymentMethod ?? "razorpay"),
      subtotal: Number(safeOrderMeta.subtotal ?? 0) || 0,
      shippingCharge: Number(safeOrderMeta.shippingCharge ?? 0) || 0,
      total: Number(safeOrderMeta.total ?? 0) || 0,
      invoiceNumber,
      status: "confirmed",
      shipping,
      cartItems: orderItems,
      payment: {
        provider: 'razorpay',
        paymentId: String(razorpay_payment_id ?? ""),
        orderId: String(razorpay_order_id ?? ""),
        signature: String(razorpay_signature ?? ""),
      },
      paymentStatus: 'paid',
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'orders'), orderToSave);
    const orderId = docRef.id;

    // Trigger invoice generation asynchronously
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const invoiceResponse = await fetch(`${baseUrl}/api/invoices/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!invoiceResponse.ok) {
        console.warn('Failed to generate invoice automatically. Will retry on order page.');
      }
    } catch (invoiceError) {
      console.error('Error triggering invoice generation:', invoiceError);
      // Don't fail the payment verification if invoice generation fails
    }

    return NextResponse.json({ ok: true, orderId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}
