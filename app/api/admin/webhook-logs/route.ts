import { getFirestore } from "firebase-admin/firestore";
import { apiJson } from "@/app/lib/api/jsonRoute";
import { getAdminApp } from "@/app/lib/firebaseAdmin";
import { verifyAdminRequest } from "@/app/lib/adminAuth.server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) return apiJson({ error: auth.message }, auth.status || 401);

    const db = getFirestore(getAdminApp());
    const snapshot = await db.collection("shiprocket_webhook_logs")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
    }));

    return apiJson({ logs });
  } catch (error) {
    console.error("Failed to fetch webhook logs:", error);
    return apiJson({ error: "Internal Server Error" }, 500);
  }
}
