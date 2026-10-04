require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^['"]|['"]$/g, '');

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey })
});

const adminUid = "Hdl7gPl2XXZBM5XReWbFstO5M1k1";

async function setAdmin() {
  try {
    await getAuth().setCustomUserClaims(adminUid, { admin: true });
    console.log(`SUCCESS: Admin claims set for UID: ${adminUid}`);

    // Verification
    const user = await getAuth().getUser(adminUid);
    console.log("Current Claims:", user.customClaims);
    process.exit(0);
  } catch (error) {
    console.error("Error setting claims:", error);
    process.exit(1);
  }
}

setAdmin();
