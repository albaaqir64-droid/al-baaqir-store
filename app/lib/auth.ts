import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const ADMIN_SESSION_KEY = "albaaqir_admin_session";
const ADMIN_PASSWORD = "Munna@6464";
const CUSTOMER_CONTACT_KEY = "albaaqir_customer_contact";
const CURRENT_USER_ID_KEY = "albaaqir_current_user_id";
const USERS_COLLECTION = "users";

export function isAdminAuthenticated() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

export function loginAdmin(password: string) {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_SESSION_KEY, "1");
    return true;
  }
  return false;
}

export function logoutAdmin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function getOrCreateCurrentUserId() {
  if (typeof window === "undefined") return null;
  let userId = localStorage.getItem(CURRENT_USER_ID_KEY);
  if (!userId) {
    userId = `user-${crypto.randomUUID()}`;
    localStorage.setItem(CURRENT_USER_ID_KEY, userId);
  }
  return userId;
}

export async function persistCustomerContact(contact: { phone: string; email?: string }) {
  if (typeof window === "undefined") return;
  const userId = getOrCreateCurrentUserId();
  if (!userId) return;

  try {
    await setDoc(
      doc(db, USERS_COLLECTION, userId),
      {
        userId,
        contact: {
          phone: String(contact.phone ?? ""),
          email: String(contact.email ?? ""),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Unable to persist customer contact to Firestore:", error);
  }
}

export function saveCustomerContact(contact: { phone: string; email?: string }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOMER_CONTACT_KEY, JSON.stringify(contact));

  let userId = localStorage.getItem(CURRENT_USER_ID_KEY);
  if (contact.phone) {
    userId = `user-${contact.phone.trim()}`;
  } else if (contact.email) {
    const normalizedEmail = contact.email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
    userId = `user-${normalizedEmail}`;
  } else if (!userId) {
    userId = `user-${crypto.randomUUID()}`;
  }

  if (userId) {
    localStorage.setItem(CURRENT_USER_ID_KEY, userId);
  }

  void persistCustomerContact(contact);
}

export function getCustomerContact() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CUSTOMER_CONTACT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as { phone: string; email?: string };
  } catch {
    return null;
  }
}

export function getCurrentUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_USER_ID_KEY);
}
