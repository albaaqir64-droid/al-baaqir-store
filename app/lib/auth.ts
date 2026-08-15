import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import {
  signInAnonymously,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { db, auth } from "./firebase";

const ADMIN_SESSION_KEY = "albaaqir_admin_session";
const ADMIN_PASSWORD = "Munna@6464";
const CUSTOMER_CONTACT_KEY = "albaaqir_customer_contact";
const CURRENT_USER_ID_KEY = "albaaqir_current_user_id";
const USERS_COLLECTION = "users";

export interface CustomerProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone?: string;
  addresses?: any[];
  wishlist?: string[];
  createdAt?: any;
  updatedAt?: any;
}

// --- Admin Authentication (Existing) ---

export function isAdminAuthenticated() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

export async function loginAdmin(password: string) {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_SESSION_KEY, "1");
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Firebase auth background sign-in failed:", error);
    }
    return true;
  }
  return false;
}

export async function logoutAdmin() {
  if (typeof window === "undefined") return;
  await signOut(auth);
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

// --- Customer Authentication (New) ---

export async function registerCustomer(email: string, pass: string, displayName?: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  await syncCustomerProfile(userCredential.user, displayName);
  return userCredential.user;
}

export async function loginCustomer(email: string, pass: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  await syncCustomerProfile(userCredential.user);
  return userCredential.user;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  await syncCustomerProfile(userCredential.user);
  return userCredential.user;
}

export async function logoutCustomer() {
  await signOut(auth);
}

export async function updateCustomerProfile(uid: string, data: Partial<CustomerProfile>) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function addAddress(uid: string, address: any) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(userRef);
  const profile = snap.data() as CustomerProfile;
  const addresses = profile?.addresses || [];
  await setDoc(userRef, { addresses: [...addresses, address], updatedAt: serverTimestamp() }, { merge: true });
}

export async function toggleWishlist(uid: string, productId: string) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(userRef);
  const profile = snap.data() as CustomerProfile;
  let wishlist = profile?.wishlist || [];
  if (wishlist.includes(productId)) {
    wishlist = wishlist.filter(id => id !== productId);
  } else {
    wishlist = [...wishlist, productId];
  }
  await setDoc(userRef, { wishlist, updatedAt: serverTimestamp() }, { merge: true });
}

async function syncCustomerProfile(user: User, displayName?: string) {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const snap = await getDoc(userRef);

  const profileData: Partial<CustomerProfile> = {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.displayName || snap.data()?.displayName || null,
    photoURL: user.photoURL || snap.data()?.photoURL || null,
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    profileData.createdAt = serverTimestamp();
    await setDoc(userRef, profileData, { merge: true });
  } else {
    await setDoc(userRef, profileData, { merge: true });
  }
}

// --- Shared & Guest Logic ---

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
  const firebaseUser = auth.currentUser;
  if (firebaseUser && !firebaseUser.isAnonymous) {
    return firebaseUser.uid;
  }
  return localStorage.getItem(CURRENT_USER_ID_KEY);
}
