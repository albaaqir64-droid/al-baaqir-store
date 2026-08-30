import { apiError, apiJson } from "@/app/lib/api/jsonRoute";
import { getShiprocketWalletBalance } from "@/app/lib/shiprocket";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getShiprocketWalletBalance();
    return apiJson(data);
  } catch (error) {
    console.error("Failed to fetch Shiprocket wallet:", error);
    return apiError(error instanceof Error ? error.message : "Failed to fetch wallet balance", 500);
  }
}
