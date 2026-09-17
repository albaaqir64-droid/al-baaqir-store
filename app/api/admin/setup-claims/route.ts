import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';

// This is a one-time utility to set admin claims
// For security, in production you should protect this with a secret key
export async function POST(request: Request) {
  try {
    const { uid, secretKey } = await request.json();

    // Basic protection - set a setup key in your env variables
    if (secretKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await adminAuth.setCustomUserClaims(uid, { admin: true });

    return NextResponse.json({ message: `Admin claims set for user ${uid}` });
  } catch (error) {
    console.error('Error setting claims:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
