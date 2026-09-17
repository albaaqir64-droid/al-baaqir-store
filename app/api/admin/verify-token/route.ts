import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ isAdmin: false, error: 'No token provided' }, { status: 400 });
    }

    // Verify the ID token using the Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Check if the user has the admin custom claim
    if (decodedToken.admin === true) {
      return NextResponse.json({ isAdmin: true });
    } else {
      return NextResponse.json({ isAdmin: false, error: 'Not an admin' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ isAdmin: false, error: 'Invalid token' }, { status: 401 });
  }
}
