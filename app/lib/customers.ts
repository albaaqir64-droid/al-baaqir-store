import {
  collection,
  getDocs,
  query,
  limit
} from "firebase/firestore";
import { db } from "./firebase";

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  fcmTokens?: string[];
  createdAt?: any;
  // We can aggregate these later
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
}

export async function fetchCustomers(max: number = 50): Promise<CustomerRecord[]> {
  try {
    const q = query(collection(db, "users"), limit(max));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().displayName || doc.data().name || "Unknown",
      email: doc.data().email || "No Email",
      phone: doc.data().phoneNumber || doc.data().phone || "No Phone",
      createdAt: doc.data().createdAt,
      ...doc.data()
    })) as CustomerRecord[];
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}
