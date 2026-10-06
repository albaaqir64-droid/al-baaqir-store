import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, email, secretKey } = body;

    // Security check: Check for ADMIN_SETUP_KEY in Vercel Env
    if (!secretKey || secretKey !== process.env.ADMIN_SETUP_KEY) {
      console.error('[Setup Claims] Unauthorized attempt: secretKey mismatch');
      return NextResponse.json({ error: 'Unauthorized: Incorrect Secret Key' }, { status: 401 });
    }

    let targetUid = uid;

    // If email is provided instead of UID, look up the user
    if (!targetUid && email) {
      console.log(`[Setup Claims] Looking up user by email: ${email}`);
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        targetUid = userRecord.uid;
      } catch (err: any) {
        return NextResponse.json({ error: 'User not found', details: err.message }, { status: 404 });
      }
    }

    if (!targetUid) {
      return NextResponse.json({ error: 'Missing UID or Email' }, { status: 400 });
    }

    const user = await adminAuth.getUser(targetUid);
    const existingClaims = user.customClaims || {};

    // Preserve existing custom claims while granting admin access.
    console.log(`[Setup Claims] Setting admin claim for UID: ${targetUid}`);
    await adminAuth.setCustomUserClaims(targetUid, { ...existingClaims, admin: true });

    return NextResponse.json({
      success: true,
      message: `Success! User ${targetUid} (${email || 'UID'}) is now an Admin.`,
      actionRequired: 'The user MUST log out and log back in (or refresh their token) for changes to take effect.'
    });
  } catch (error: any) {
    console.error('[Setup Claims] Critical Error:', error.message);
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
  }
}
