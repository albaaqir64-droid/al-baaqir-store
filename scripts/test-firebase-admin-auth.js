const { loadEnvConfig } = require("@next/env");
const fs = require("node:fs");
const path = require("node:path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

loadEnvConfig(process.cwd());

async function main() {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  const projectIdFromEnv = (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").replace(/[\'\"]/g, "").trim();
  const clientEmailFromEnv = (process.env.FIREBASE_CLIENT_EMAIL || "").replace(/[\'\"]/g, "").trim();
  const privateKeyFromEnv = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n").trim().replace(/^[\'"]|[\'"]$/g, "");
  const credentialMode = configuredPath ? "FIREBASE_SERVICE_ACCOUNT_PATH" : "environment variables";
  let serviceAccount;
  let resolvedPath;

  if (configuredPath) {
    resolvedPath = path.resolve(process.cwd(), configuredPath);
    const fileExists = fs.existsSync(resolvedPath);
    console.log("Credential mode:", credentialMode);
    console.log("Service-account JSON file exists:", fileExists);
    if (fileExists) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
        console.log("JSON project_id:", serviceAccount.project_id || "(missing)");
        console.log("JSON client_email exists:", Boolean(serviceAccount.client_email));
        console.log("JSON private_key exists:", Boolean(serviceAccount.private_key));
        console.log("JSON private_key contains BEGIN PRIVATE KEY:", typeof serviceAccount.private_key === "string" && serviceAccount.private_key.includes("-----BEGIN PRIVATE KEY-----"));
      } catch {
        console.log("JSON parse: FAILED");
      }
    }
    console.log("Firebase project ID being used:", serviceAccount?.project_id || "(unavailable)");
  } else {
    console.log("Credential mode:", credentialMode);
    console.log("Service-account JSON file exists:", false);
    console.log("JSON project_id:", "(not applicable)");
    console.log("JSON client_email exists:", false);
    console.log("JSON private_key exists:", false);
    console.log("JSON private_key contains BEGIN PRIVATE KEY:", false);
    console.log("Environment client_email exists:", Boolean(clientEmailFromEnv));
    console.log("Environment private_key exists:", Boolean(privateKeyFromEnv));
    console.log("Environment private_key contains BEGIN PRIVATE KEY:", privateKeyFromEnv.includes("-----BEGIN PRIVATE KEY-----"));
    console.log("Firebase project ID being used:", projectIdFromEnv || "(missing)");
  }
  console.log("Service-account project_id matches al-baaqir-store:", (serviceAccount?.project_id || projectIdFromEnv) === "al-baaqir-store");

  try {
    let credential;
    let projectId;
    if (configuredPath) {
      if (!serviceAccount) throw new Error("Service-account JSON could not be read");
      projectId = serviceAccount.project_id;
      credential = cert(serviceAccount);
    } else {
      projectId = projectIdFromEnv;
      const clientEmail = clientEmailFromEnv;
      const privateKey = privateKeyFromEnv;
      credential = cert({ projectId, clientEmail, privateKey });
    }
    if (!projectId) throw new Error("Missing Firebase project ID");
    const app = initializeApp({ credential, storageBucket: `${projectId}.firebasestorage.app` });
    await getAuth(app).listUsers(1);
    console.log("Firebase Admin authentication: SUCCESS");
  } catch (error) {
    console.error("Firebase Admin authentication: FAILED");
    console.error("Error code:", error.code || error.name || "unknown error");
    console.error("Error message:", error.message || "(no message)");
    process.exitCode = 1;
  }
}

main();
