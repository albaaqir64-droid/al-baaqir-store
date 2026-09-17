import { NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const orderData = await request.json();

    // Add server-side timestamp
    const finalOrder = {
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Firestore using Admin SDK
    const docRef = await adminDb.collection('orders').add(finalOrder);

    return NextResponse.json({
      success: true,
      orderId: docRef.id
    });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process order'
    }, { status: 500 });
  }
}
