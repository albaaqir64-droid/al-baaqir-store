import { NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';
import { sendContactInquiryEmail } from '@/app/lib/email';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, message, phone } = data;

    // Save to Firestore
    await adminDb.collection('inquiries').add({
      name,
      email,
      phone,
      message,
      createdAt: new Date().toISOString()
    });

    // Send email notification
    try {
      await sendContactInquiryEmail({ name, email, message, phone });
    } catch (emailError) {
      console.error('Failed to send inquiry email:', emailError);
      // We don't fail the whole request if email fails, as long as it's saved in DB
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}
