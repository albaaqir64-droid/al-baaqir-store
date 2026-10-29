import { apiError, apiJson } from "@/app/lib/api/jsonRoute";
import { verifyAdminRequest } from "@/app/lib/adminAuth.server";
import { adminDb, FieldValue } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";

const STATS_COLLECTION = "site_stats";
const GLOBAL_STATS_DOC = "global";

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.ok) return apiJson({ error: auth.message }, auth.status || 401);

  try {
    const snapshot = await adminDb.collection(STATS_COLLECTION).doc(GLOBAL_STATS_DOC).get();
    return apiJson({ totalVisitors: Number(snapshot.data()?.totalVisitors) || 0 });
  } catch (error) {
    console.error("Failed to load visitor count:", error);
    return apiError("Failed to load visitor count", 500);
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return apiError("Visit tracking requests must come from this site", 403);
  }

  try {
    await adminDb.collection(STATS_COLLECTION).doc(GLOBAL_STATS_DOC).set({
      totalVisitors: FieldValue.increment(1),
      lastVisitorAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return apiJson({ success: true });
  } catch (error) {
    console.error("Failed to track visit:", error);
    return apiError("Failed to track visit", 500);
  }
}
