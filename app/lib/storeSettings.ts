export interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeDescription: string;
  businessAddress: string;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  whatsappMessage: string;
}

export type PublicStoreSettings = Pick<
  StoreSettings,
  | "storeName"
  | "storeEmail"
  | "storePhone"
  | "storeDescription"
  | "whatsappEnabled"
  | "whatsappNumber"
  | "whatsappMessage"
>;

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "Al Baaqir",
  storeEmail: "albaaqir64@gmail.com",
  storePhone: "7041396464",
  storeDescription: "Premium Indian lifestyle essentials.",
  businessAddress: "",
  whatsappEnabled: true,
  whatsappNumber: "917041396464",
  whatsappMessage: "Hi Al Baaqir, I need help with my order.",
};

export const DEFAULT_PUBLIC_STORE_SETTINGS: PublicStoreSettings = {
  storeName: DEFAULT_STORE_SETTINGS.storeName,
  storeEmail: DEFAULT_STORE_SETTINGS.storeEmail,
  storePhone: DEFAULT_STORE_SETTINGS.storePhone,
  storeDescription: DEFAULT_STORE_SETTINGS.storeDescription,
  whatsappEnabled: DEFAULT_STORE_SETTINGS.whatsappEnabled,
  whatsappNumber: DEFAULT_STORE_SETTINGS.whatsappNumber,
  whatsappMessage: DEFAULT_STORE_SETTINGS.whatsappMessage,
};
