import { getFirestore } from "firebase-admin/firestore";
import { apiJson } from "@/app/lib/api/jsonRoute";
import { getAdminApp } from "@/app/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
