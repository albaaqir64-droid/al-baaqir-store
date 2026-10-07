import { NextResponse } from 'next/server';
import { adminAuth, getAdminApp } from '@/app/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ isAdmin: false, error: 'No token provided' }, { status: 400 });
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(token);

    const adminApp = getAdminApp();
    console.info('[Admin Verify] Production token diagnostics:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      signInProvider: decodedToken.firebase?.sign_in_provider,
      admin: decodedToken.admin,
      adminType: typeof decodedToken.admin,
      authTime: decodedToken.auth_time,
      issuedAt: decodedToken.iat,
      expiresAt: decodedToken.exp,
      firebaseAdminProjectId: adminApp?.options?.projectId,
      firebaseAdminCredentialConfig: {
        serviceAccountPathSet: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
        projectIdSet: Boolean(process.env.FIREBASE_PROJECT_ID),
        clientEmailSet: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
        privateKeySet: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      },
    });

    // Check if the user has the admin custom claim
    if (decodedToken.admin === true) {
      return NextResponse.json({ isAdmin: true });
    } else {
      console.warn('[Admin Verify] Access denied: decoded token admin claim is not true.', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        admin: decodedToken.admin,
        adminType: typeof decodedToken.admin,
      });
      return NextResponse.json({
        isAdmin: false,
        error: 'Not an admin',
        uid: decodedToken.uid,
        debug: {
          projectId: adminApp?.options?.projectId,
          hasAdminClaim: !!decodedToken.admin,
          claimValue: decodedToken.admin,
          email: decodedToken.email
        }
      }, { status: 403 });
    }
  } catch (error: any) {
    console.error('[Admin Verify] Token verification failed:', error.code || error.name || 'unknown error');
    return NextResponse.json({
      isAdmin: false,
      error: 'Invalid token',
      details: error.message
    }, { status: 401 });
  }
}
