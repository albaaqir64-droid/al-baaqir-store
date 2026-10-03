import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ isAdmin: false, error: 'No token provided' }, { status: 400 });
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(token);

    console.log(`[Admin Verify] User UID: ${decodedToken.uid}`);
    console.log(`[Admin Verify] Claims:`, decodedToken.admin);

    // Check if the user has the admin custom claim
    if (decodedToken.admin === true) {
      return NextResponse.json({ isAdmin: true });
    } else {
      // Very Important: This tells you if the user is logged in but NOT an admin
      console.warn(`[Admin Verify] Access Denied: User ${decodedToken.email} is not an admin`);
      return NextResponse.json({
        isAdmin: false,
        error: 'Not an admin',
        uid: decodedToken.uid // Sending UID back to help you set claims
      }, { status: 403 });
    }
  } catch (error: any) {
    console.error('[Admin Verify] Error:', error.message);
    return NextResponse.json({
      isAdmin: false,
      error: 'Invalid token',
      details: error.message
    }, { status: 401 });
  }
}
