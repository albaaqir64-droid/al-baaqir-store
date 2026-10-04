const fs = require('fs');
const path = require('path');

async function run() {
  let env = {};
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          let value = match[2] || '';
          value = value.trim();
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          env[match[1]] = value;
        }
      });
    }
  } catch (e) {
    console.error("Error reading .env.local:", e);
  }

  // Firebase Admin v14 style imports
  const { initializeApp, cert } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');

  const projectId = env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing credentials in .env.local");
    process.exit(1);
  }

  try {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey })
    });

    const uid = "Hdl7gPl2XXZBM5XReWbFstO5M1k1";
    console.log(`Setting admin claim for UID: ${uid}...`);

    await getAuth().setCustomUserClaims(uid, { admin: true });
    console.log("Successfully set admin claim.");

    const user = await getAuth().getUser(uid);
    console.log("Verified Custom Claims:", user.customClaims);

    process.exit(0);
  } catch (err) {
    console.error("Critical Error:", err);
    process.exit(1);
  }
}

run();
