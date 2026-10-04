const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const fs = require("fs");
const path = require("path");

// Function to load .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Error: .env.local file not found!");
    process.exit(1);
  }
  const envFile = fs.readFileSync(envPath, "utf8");
  envFile.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  });
}

loadEnv();

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const uid = "Hdl7gPl2XXZBM5XReWbFstO5M1k1";

if (!projectId || !clientEmail || !privateKey) {
  console.error("Error: Firebase credentials missing in .env.local");
  process.exit(1);
}

const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey })
});

async function setAdmin() {
  try {
    console.log(`Setting admin claims for UID: ${uid}...`);
    await getAuth(app).setCustomUserClaims(uid, { admin: true });
    console.log("--------------------------------------------------");
    console.log("SUCCESS: User is now an Admin!");
    console.log("IMPORTANT: Please Sign Out and Sign Back In to your website.");
    console.log("--------------------------------------------------");
    process.exit(0);
  } catch (error) {
    console.error("Error setting admin claims:", error.message);
    process.exit(1);
  }
}

setAdmin();
