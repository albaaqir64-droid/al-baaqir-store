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

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    console.log(`[Admin Verify] Project: ${projectId}, UID: ${decodedToken.uid}`);
    console.log(`[Admin Verify] All Claims:`, JSON.stringify(decodedToken));

    // Check if the user has the admin custom claim
    if (decodedToken.admin === true) {
      return NextResponse.json({ isAdmin: true });
    } else {
      console.warn(`[Admin Verify] Access Denied: User ${decodedToken.email} does not have {admin: true}. Current claims:`, decodedToken.admin);
      return NextResponse.json({
        isAdmin: false,
        error: 'Not an admin',
        uid: decodedToken.uid,
        debug: {
          projectId: projectId,
          hasAdminClaim: !!decodedToken.admin,
          claimValue: decodedToken.admin,
          email: decodedToken.email
        }
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
