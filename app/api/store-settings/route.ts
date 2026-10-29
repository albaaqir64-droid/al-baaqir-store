import { apiError, apiJson } from "@/app/lib/api/jsonRoute";
import { getPublicStoreSettings, readStoreSettings } from "@/app/lib/storeSettings.server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await readStoreSettings();
    return apiJson(getPublicStoreSettings(settings));
  } catch (error) {
    console.error("Failed to load public store settings:", error);
    return apiError("Failed to load store settings", 500);
  }
}
