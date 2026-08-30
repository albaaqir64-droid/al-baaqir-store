import "server-only";

const SHIPROCKET_AUTH_URL = "https://apiv2.shiprocket.in/v1/external/auth/login";
const SHIPROCKET_ORDER_URL = "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc";
const SHIPROCKET_LABEL_URL = "https://apiv2.shiprocket.in/v1/external/courier/generate/label";
const SHIPROCKET_MANIFEST_URL = "https://apiv2.shiprocket.in/v1/external/manifests/generate";
const SHIPROCKET_PRINT_MANIFEST_URL = "https://apiv2.shiprocket.in/v1/external/manifests/print";
const SHIPROCKET_WALLET_URL = "https://apiv2.shiprocket.in/v1/external/settings/get/wallet_balance";
const SHIPROCKET_TRACKING_URL = "https://apiv2.shiprocket.in/v1/external/courier/track/shipment";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function getShiprocketToken(): Promise<string> {
  // 1. Force fresh environment variable access
  const rawEmail = process.env.SHIPROCKET_EMAIL || "";
  const rawPassword = process.env.SHIPROCKET_PASSWORD || "";

  // 2. Aggressive cleanup: trim, remove surrounding quotes, and handle escaped characters
  const email = rawEmail.trim().replace(/^["']|["']$/g, "").toLowerCase();

  // Deep cleanup for password:
  // 1. Trim whitespace
  // 2. Remove surrounding single or double quotes
  // 3. Remove literal backslashes (\$) that may be left over from env escaping
  const password = rawPassword.trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\(\$)/g, "$1")
    .replace(/\\(\^)/g, "$1");

  // 3. Tracking & Debugging (Server-side only)
  console.log(`[Shiprocket-Auth] Attempting login for API User: "${email.substring(0, 4)}***${email.substring(email.indexOf('@'))}"`);
  console.log(`[Shiprocket-Auth] Credential Lengths -> Email: ${email.length}, Password: ${password.length}`);

  if (!email || !password) {
    throw new Error("Shiprocket Auth Failed: Missing SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD in .env.local");
  }

  // 4. Use cached token if valid (Shiprocket tokens last 10 days / 240 hours)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch(SHIPROCKET_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Shiprocket-Auth] API ERROR Status:", response.status);
      console.error("[Shiprocket-Auth] API ERROR Body:", JSON.stringify(data));

      // Handle the "User Blocked" case specifically as requested
      const isBlocked = response.status === 403 ||
                        data.status_code === 403 ||
                        (data.message && data.message.toLowerCase().includes("blocked")) ||
                        (data.errors && JSON.stringify(data.errors).toLowerCase().includes("blocked"));

      if (isBlocked) {
        throw new Error("SHIPROCKET_API_USER_BLOCKED: The API User is blocked due to too many failed attempts. Please LOGIN to the Shiprocket Panel -> Settings -> API -> API User and either UNBLOCK the user or CREATE A NEW API USER.");
      }

      const errorMsg = data.message || (data.errors ? JSON.stringify(data.errors) : response.statusText);
      throw new Error(`Shiprocket Auth Failed: ${errorMsg}`);
    }

    if (!data.token) {
      throw new Error("Shiprocket Auth Failed: Token missing in success response.");
    }

    cachedToken = data.token;
    // Set expiry to 9 days to be safe (official is 10 days)
    tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
    console.log("[Shiprocket-Auth] Successfully authenticated API User.");

    return data.token;
  } catch (err) {
    console.error("[Shiprocket-Auth] EXCEPTION:", err);
    throw err;
  }
}

export interface ShiprocketOrderItems {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}

export interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string; // YYYY-MM-DD HH:mm
  pickup_location: string; // This is usually a name configured in Shiprocket panel
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: ShiprocketOrderItems[];
  payment_method: "Prepaid" | "COD";
  shipping_charges: number;
  total_discount: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export async function createShiprocketOrder(payload: ShiprocketOrderPayload) {
  try {
    const token = await getShiprocketToken();

    console.log("[Shiprocket-Order] Creating order with ID:", payload.order_id);
    // Safer logging of payload (omitting full address/phone for privacy if needed, but here we need to see it for debugging)
    console.log("[Shiprocket-Order] Payload:", JSON.stringify({
      ...payload,
      billing_phone: payload.billing_phone.replace(/.(?=.{4})/g, '*'),
      billing_email: payload.billing_email.replace(/.(?=.{3}@)/g, '*'),
    }));

    const response = await fetch(SHIPROCKET_ORDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("[Shiprocket-Order] Response Status:", response.status);
    console.log("[Shiprocket-Order] Response Body:", JSON.stringify(result));

    // Shiprocket status_code 1 means success. Sometimes it returns 200 with errors in the body.
    if (!response.ok || (result.status_code !== undefined && result.status_code !== 1)) {
      console.error("Shiprocket Order Creation Error:", result);
      return {
        success: false,
        error: result.errors || result.message || "Unknown Shiprocket error",
        status: response.status,
        status_code: result.status_code,
      };
    }

    return {
      success: true,
      order_id: result.order_id,
      shipment_id: result.shipment_id,
      status: result.status,
      status_code: result.status_code,
    };
  } catch (err) {
    console.error("Shiprocket Request Failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getShiprocketLabel(shipmentIds: (string | number)[]) {
  try {
    const token = await getShiprocketToken();
    const response = await fetch(SHIPROCKET_LABEL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds] }),
    });

    const result = await response.json();

    if (!response.ok || !result.label_created) {
      console.error("Shiprocket Label Generation Error:", result);
      throw new Error(result.message || "Failed to generate Shiprocket label");
    }

    return result.label_url;
  } catch (err) {
    console.error("getShiprocketLabel failed:", err);
    throw err;
  }
}

export async function generateShiprocketManifest(shipmentIds: (string | number)[]) {
  try {
    const token = await getShiprocketToken();
    const response = await fetch(SHIPROCKET_MANIFEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_id: shipmentIds }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to generate manifest");
    }

    return result;
  } catch (err) {
    console.error("generateShiprocketManifest failed:", err);
    throw err;
  }
}

export async function printShiprocketManifest(shipmentIds: (string | number)[]) {
  try {
    const token = await getShiprocketToken();
    const response = await fetch(SHIPROCKET_PRINT_MANIFEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_id: shipmentIds }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to print manifest");
    }

    return result.manifest_url;
  } catch (err) {
    console.error("printShiprocketManifest failed:", err);
    throw err;
  }
}

export async function getShiprocketWalletBalance() {
  try {
    const token = await getShiprocketToken();
    const response = await fetch(SHIPROCKET_WALLET_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch wallet balance");
    }

    return result.data; // Usually { balance_amount: "...", ... }
  } catch (err) {
    console.error("getShiprocketWalletBalance failed:", err);
    throw err;
  }
}

export async function getShiprocketTrackingData(shipmentId: string | number) {
  try {
    const token = await getShiprocketToken();
    const response = await fetch(`${SHIPROCKET_TRACKING_URL}/${shipmentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch tracking data");
    }

    return result.tracking_data;
  } catch (err) {
    console.error("getShiprocketTrackingData failed:", err);
    throw err;
  }
}

/**
 * Maps Firestore order data to Shiprocket payload and syncs it.
 * This should be called AFTER the order is saved to our database.
 */
export async function syncOrderToShiprocket(orderId: string, orderData: any) {
  try {
    // 0. Safety check: Don't re-sync if already have SR Order ID
    if (orderData.shiprocketOrderId) {
      console.log(`[Shiprocket-Sync] Order ${orderId} already has Shiprocket Order ID: ${orderData.shiprocketOrderId}`);
      return {
        shiprocketOrderId: orderData.shiprocketOrderId,
        shiprocketShipmentId: orderData.shiprocketShipmentId,
        shiprocketStatus: orderData.shiprocketStatus || "NEW",
        shiprocketSyncAt: orderData.shiprocketSyncAt || new Date().toISOString(),
      };
    }

    const isCod = String(orderData.paymentMethod).toLowerCase() === "cod";

    // Map Firestore items to Shiprocket items
    let calculatedSubtotal = 0;
    const orderItems: ShiprocketOrderItems[] = (orderData.cartItems || []).map((item: any) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      calculatedSubtotal += price * qty;

      return {
        name: String(item.name || "Product").substring(0, 50),
        sku: String(item.sku || item.id || item.slug || "SKU-UNKNOWN").substring(0, 30),
        units: qty,
        selling_price: price,
        discount: 0,
        tax: 0,
        hsn: item.hsnSac ? parseInt(item.hsnSac) : undefined,
      };
    });

    // Dimensions calculation ...
    let totalWeight = 0;
    let maxLength = 0;
    let maxBreadth = 0;
    let totalHeight = 0;

    if (orderData.cartItems && Array.isArray(orderData.cartItems)) {
      orderData.cartItems.forEach((item: any) => {
        const qty = Number(item.quantity) || 1;
        const w = item.weight ? Number(item.weight) : 0.5;
        totalWeight += w * qty;

        const dim = item.dimensions || {};
        maxLength = Math.max(maxLength, Number(dim.length) || 20);
        maxBreadth = Math.max(maxBreadth, Number(dim.breadth) || 15);
        totalHeight += (Number(dim.height) || 10) * qty;
      });
    }

    // Default fallbacks if empty
    if (totalWeight === 0) totalWeight = 0.5;
    if (maxLength === 0) maxLength = 20;
    if (maxBreadth === 0) maxBreadth = 15;
    if (totalHeight === 0) totalHeight = 10;

    const weight = Math.max(0.1, totalWeight);
    const length = Math.max(1, maxLength);
    const breadth = Math.max(1, maxBreadth);
    const height = Math.max(1, totalHeight);

    // Shiprocket expects order_id to be unique. Using Invoice Number is best.
    const srOrderId = orderData.invoiceNumber || `ORD-${orderId.slice(-8).toUpperCase()}`;

    const payload: ShiprocketOrderPayload = {
      order_id: srOrderId,
      order_date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
      billing_customer_name: (orderData.customerName || orderData.shipping?.name || "Customer").split(' ')[0],
      billing_last_name: (orderData.customerName || orderData.shipping?.name || "Customer").split(' ').slice(1).join(' ') || "User",
      billing_address: orderData.shipping?.address || "Address missing",
      billing_address_2: orderData.shipping?.address2 || "",
      billing_city: orderData.shipping?.city || "City",
      billing_pincode: String(orderData.shipping?.pincode || "").trim(),
      billing_state: orderData.shipping?.state || "State",
      billing_country: "India",
      billing_email: orderData.email || "customer@al-baaqir.com",
      billing_phone: String(orderData.phone || orderData.shipping?.phone || "").replace(/[^0-9]/g, '').slice(-10),
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: isCod ? "COD" : "Prepaid",
      shipping_charges: Number(orderData.shippingCharge) || 0,
      total_discount: Number(orderData.discount || orderData.discountAmount) || 0,
      sub_total: calculatedSubtotal,
      length: length,
      breadth: breadth,
      height: height,
      weight: weight,
    };

    // Strict Validations
    if (!payload.billing_phone || payload.billing_phone.length < 10) {
      throw new Error(`Invalid phone: "${payload.billing_phone}". Need 10 digits.`);
    }
    if (!payload.billing_pincode || payload.billing_pincode.length < 6) {
      throw new Error(`Invalid pincode: "${payload.billing_pincode}". Need 6 digits.`);
    }
    if (payload.order_items.length === 0) {
      throw new Error("Cannot sync empty order to Shiprocket.");
    }

    const result = await createShiprocketOrder(payload);

    if (!result.success) {
      const errorMsg = typeof result.error === "object" ? JSON.stringify(result.error) : String(result.error);
      return {
        shiprocketStatus: "FAILED",
        shiprocketError: errorMsg,
        shiprocketSyncAt: new Date().toISOString(),
      };
    }

    return {
      shiprocketOrderId: String(result.order_id),
      shiprocketShipmentId: String(result.shipment_id || ""),
      shiprocketStatus: "NEW",
      shiprocketError: null,
      shiprocketSyncAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[Shiprocket-Sync] CRITICAL EXCEPTION:", err);
    return {
      shiprocketStatus: "FAILED",
      shiprocketError: err instanceof Error ? err.message : String(err),
      shiprocketSyncAt: new Date().toISOString(),
    };
  }
}
