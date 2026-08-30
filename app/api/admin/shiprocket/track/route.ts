import { apiError, apiJson, readRequestJson } from "@/app/lib/api/jsonRoute";
import { getShiprocketTrackingData } from "@/app/lib/shiprocket";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const parsed = await readRequestJson(request);
    if (!parsed.ok) return parsed.response;

    const { shipmentId } = parsed.data as { shipmentId: string | number };

    if (!shipmentId) {
      return apiError("Shipment ID is required", 400);
    }

    const data = await getShiprocketTrackingData(shipmentId);
    return apiJson(data);
  } catch (error) {
    console.error("Failed to fetch Shiprocket tracking:", error);
    return apiError(error instanceof Error ? error.message : "Failed to fetch tracking data", 500);
  }
}
