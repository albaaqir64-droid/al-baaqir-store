import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

const STATS_COLLECTION = "site_stats";
const GLOBAL_STATS_DOC = "global";

export async function trackVisit() {
  if (typeof window === "undefined") return;

  // Simple session tracking using sessionStorage
  const sessionKey = "baaqir_session_tracked";
  if (sessionStorage.getItem(sessionKey)) return;

  try {
    const statsRef = doc(db, STATS_COLLECTION, GLOBAL_STATS_DOC);
    const snap = await getDoc(statsRef);

    if (!snap.exists()) {
      await setDoc(statsRef, {
        totalVisitors: 1,
        lastVisitorAt: serverTimestamp(),
      });
    } else {
      await updateDoc(statsRef, {
        totalVisitors: increment(1),
        lastVisitorAt: serverTimestamp(),
      });
    }

    sessionStorage.setItem(sessionKey, "true");
  } catch (error) {
    console.error("Failed to track visit:", error);
  }
}

export async function getVisitorCount(): Promise<number> {
  try {
    const statsRef = doc(db, STATS_COLLECTION, GLOBAL_STATS_DOC);
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      return snap.data().totalVisitors || 0;
    }
  } catch (error) {
    console.error("Failed to get visitor count:", error);
  }
  return 0;
}
