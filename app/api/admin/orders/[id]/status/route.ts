import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken.admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status } = await request.json();

    await adminDb.collection('orders').doc(orderId).update({
      status,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ message: 'Order status updated successfully' });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
