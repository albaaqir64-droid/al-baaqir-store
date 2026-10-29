import "server-only";

import { BUSINESS } from "./business";
import { adminDb } from "./firebaseAdmin";
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from "./storeSettings";

const SETTINGS_COLLECTION = "store_settings";
const STOREFRONT_SETTINGS_DOC = "storefront";

function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export async function readStoreSettings(): Promise<StoreSettings> {
  const snapshot = await adminDb.collection(SETTINGS_COLLECTION).doc(STOREFRONT_SETTINGS_DOC).get();
  const saved = snapshot.data() ?? {};
  const defaultNumber = normalizeWhatsAppNumber(BUSINESS.whatsapp);

  return {
    storeName: typeof saved.storeName === "string" ? saved.storeName : BUSINESS.name,
    storeEmail: typeof saved.storeEmail === "string" ? saved.storeEmail : BUSINESS.email,
    storePhone: typeof saved.storePhone === "string" ? saved.storePhone : BUSINESS.phone,
    storeDescription: typeof saved.storeDescription === "string"
      ? saved.storeDescription
      : DEFAULT_STORE_SETTINGS.storeDescription,
    businessAddress: typeof saved.businessAddress === "string" ? saved.businessAddress : "",
    whatsappEnabled: typeof saved.whatsappEnabled === "boolean" ? saved.whatsappEnabled : true,
    whatsappNumber: typeof saved.whatsappNumber === "string" ? saved.whatsappNumber : defaultNumber,
    whatsappMessage: typeof saved.whatsappMessage === "string"
      ? saved.whatsappMessage
      : DEFAULT_STORE_SETTINGS.whatsappMessage,
  };
}

export function getPublicStoreSettings(settings: StoreSettings) {
  return {
    storeName: settings.storeName,
    storeEmail: settings.storeEmail,
    storePhone: settings.storePhone,
    storeDescription: settings.storeDescription,
    whatsappEnabled: settings.whatsappEnabled,
    whatsappNumber: settings.whatsappNumber,
    whatsappMessage: settings.whatsappMessage,
  };
}

export const storeSettingsDocument = {
  collection: SETTINGS_COLLECTION,
  document: STOREFRONT_SETTINGS_DOC,
};
