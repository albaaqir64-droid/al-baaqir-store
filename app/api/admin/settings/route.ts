import { apiError, apiJson, readRequestJson } from "@/app/lib/api/jsonRoute";
import { verifyAdminRequest } from "@/app/lib/adminAuth.server";
import { adminDb, FieldValue } from "@/app/lib/firebaseAdmin";
import { readStoreSettings, storeSettingsDocument } from "@/app/lib/storeSettings.server";
import type { StoreSettings } from "@/app/lib/storeSettings";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.ok) return apiJson({ error: auth.message }, auth.status || 401);

  try {
    return apiJson(await readStoreSettings());
  } catch (error) {
    console.error("Failed to load store settings:", error);
    return apiError("Failed to load store settings", 500);
  }
}

export async function PUT(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.ok) return apiJson({ error: auth.message }, auth.status || 401);

  const parsed = await readRequestJson(request);
  if (!parsed.ok) return parsed.response;

  if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
    return apiError("Settings must be sent as a JSON object", 400);
  }

  const body = parsed.data as Partial<StoreSettings>;
  const storeName = typeof body.storeName === "string" ? body.storeName.trim() : "";
  const storeEmail = typeof body.storeEmail === "string" ? body.storeEmail.trim() : "";
  const storePhone = typeof body.storePhone === "string" ? body.storePhone.trim() : "";
  const storeDescription = typeof body.storeDescription === "string" ? body.storeDescription.trim() : "";
  const businessAddress = typeof body.businessAddress === "string" ? body.businessAddress.trim() : "";
  const whatsappNumber = typeof body.whatsappNumber === "string"
    ? body.whatsappNumber.replace(/\D/g, "")
    : "";
  const whatsappMessage = typeof body.whatsappMessage === "string" ? body.whatsappMessage.trim() : "";

  if (!storeName || storeName.length > 80) {
    return apiError("Store name is required and must be 80 characters or fewer", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeEmail) || storeEmail.length > 254) {
    return apiError("Enter a valid store email address", 400);
  }
  if (storePhone.replace(/\D/g, "").length < 8 || storePhone.length > 30) {
    return apiError("Enter a valid store phone number", 400);
  }
  if (storeDescription.length > 500 || businessAddress.length > 300) {
    return apiError("Store description or address exceeds the allowed length", 400);
  }
  if (typeof body.whatsappEnabled !== "boolean") {
    return apiError("Choose whether the WhatsApp chat button is enabled", 400);
  }
  if (whatsappNumber.length < 8 || whatsappNumber.length > 15) {
    return apiError("WhatsApp number must include a country code and contain 8 to 15 digits", 400);
  }
  if (!whatsappMessage || whatsappMessage.length > 500) {
    return apiError("WhatsApp message is required and must be 500 characters or fewer", 400);
  }

  const settings: StoreSettings = {
    storeName,
    storeEmail,
    storePhone,
    storeDescription,
    businessAddress,
    whatsappEnabled: body.whatsappEnabled,
    whatsappNumber,
    whatsappMessage,
  };

  try {
    await adminDb.collection(storeSettingsDocument.collection)
      .doc(storeSettingsDocument.document)
      .set({ ...settings, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    return apiJson({ success: true, settings });
  } catch (error) {
    console.error("Failed to save store settings:", error);
    return apiError("Failed to save store settings", 500);
  }
}
