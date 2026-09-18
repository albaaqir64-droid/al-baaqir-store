import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';

// This is a one-time utility to set admin claims
// For security, in production you should protect this with a secret key
export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (!text.trim()) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (parseErr: any) {
      console.error('[Setup Claims] JSON parsing failed for raw body text:', text);
      return NextResponse.json({ error: 'Invalid JSON format', details: parseErr.message }, { status: 400 });
    }

    const { uid, secretKey } = body;

    // Basic protection - set a setup key in your env variables
    if (!secretKey || secretKey !== process.env.ADMIN_SETUP_KEY) {
      console.warn('[Setup Claims] Unauthorized attempt or mismatched secretKey.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!uid) {
      console.warn('[Setup Claims] Missing uid in request body.');
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    console.log(`[Setup Claims] Attempting to set admin claims for uid: ${uid}`);

    // Check if adminAuth is initialized properly or if it's a dummy object
    if (!adminAuth || typeof adminAuth.setCustomUserClaims !== 'function') {
      throw new Error('Firebase Admin Auth SDK is not properly initialized. Check your environment variables (PROJECT_ID, PRIVATE_KEY, CLIENT_EMAIL).');
    }

    await adminAuth.setCustomUserClaims(uid, { admin: true });
    console.log(`[Setup Claims] Successfully set admin claims for user ${uid}`);

    return NextResponse.json({ message: `Admin claims set for user ${uid}` });
  } catch (error: any) {
    console.error('[Setup Claims] Detailed Error:', {
      message: error?.message || error,
      code: error?.code,
      stack: error?.stack
    });
    return NextResponse.json({ error: 'Internal server error', details: error?.message || 'Unknown error' }, { status: 500 });
  }
}


