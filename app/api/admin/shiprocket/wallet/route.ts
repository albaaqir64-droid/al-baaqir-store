import { apiError, apiJson } from "@/app/lib/api/jsonRoute";
import { getShiprocketWalletBalance } from "@/app/lib/shiprocket";
import { verifyAdminRequest } from "@/app/lib/adminAuth.server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) return apiJson({ error: auth.message }, auth.status || 401);

    const data = await getShiprocketWalletBalance();
    return apiJson(data);
  } catch (error) {
    console.error("Failed to fetch Shiprocket wallet:", error);
    return apiError(error instanceof Error ? error.message : "Failed to fetch wallet balance", 500);
  }
}
