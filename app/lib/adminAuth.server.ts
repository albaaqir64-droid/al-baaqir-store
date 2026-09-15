import "server-only";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "./firebaseAdmin";

export interface AdminAuthResult {
  ok: boolean;
  uid?: string;
  email?: string;
  status?: number;
  message?: string;
}

export async function verifyAdminRequest(req: Request): Promise<AdminAuthResult> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { ok: false, status: 401, message: "Missing or invalid authorization header" };
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth(getAdminApp()).verifyIdToken(token);

    if (decodedToken.admin !== true) {
      return { ok: false, status: 403, message: "Forbidden: Admin access required" };
    }

    return {
      ok: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error) {
    console.error("Admin verification error:", error);
    return { ok: false, status: 401, message: "Invalid or expired token" };
  }
}
