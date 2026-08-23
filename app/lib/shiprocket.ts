import "server-only";

const SHIPROCKET_AUTH_URL = "https://apiv2.shiprocket.in/v1/external/auth/login";
const SHIPROCKET_ORDER_URL = "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function getShiprocketToken(): Promise<string> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error("Shiprocket credentials (EMAIL/PASSWORD) not configured.");
  }

  // Use cached token if valid (Shiprocket tokens typically last 10 days)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch(SHIPROCKET_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Shiprocket Auth Failed: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  cachedToken = data.token;
  // Set expiry to 9 days to be safe
  tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;

  return cachedToken!;
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
  width: number;
  height: number;
  weight: number;
}

export async function createShiprocketOrder(payload: ShiprocketOrderPayload) {
  try {
    const token = await getShiprocketToken();

    const response = await fetch(SHIPROCKET_ORDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Shiprocket Order Creation Error:", result);
      return {
        success: false,
        error: result.errors || result.message || "Unknown Shiprocket error",
        status: response.status,
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

/**
 * Maps Firestore order data to Shiprocket payload and syncs it.
 * This should be called AFTER the order is saved to our database.
 */
export async function syncOrderToShiprocket(orderId: string, orderData: any) {
  try {
    const isCod = orderData.paymentMethod === "cod";

    // Map Firestore items to Shiprocket items
    const orderItems: ShiprocketOrderItems[] = (orderData.cartItems || []).map((item: any) => ({
      name: item.name,
      sku: item.id, // Using product ID as SKU
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      tax: 0,
      hsn: item.hsnSac ? parseInt(item.hsnSac) : undefined,
    }));

    const payload: ShiprocketOrderPayload = {
      order_id: orderData.invoiceNumber || orderId,
      order_date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      pickup_location: "Primary", // Must match a location name in Shiprocket dashboard
      billing_customer_name: orderData.customerName || orderData.shipping?.name || "Customer",
      billing_last_name: "",
      billing_address: orderData.shipping?.address || "",
      billing_city: orderData.shipping?.city || "",
      billing_pincode: orderData.shipping?.pincode || "",
      billing_state: orderData.shipping?.state || "",
      billing_country: "India",
      billing_email: orderData.email || "no-email@example.com",
      billing_phone: orderData.phone || orderData.shipping?.phone || "",
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: isCod ? "COD" : "Prepaid",
      shipping_charges: orderData.shippingCharge || 0,
      total_discount: orderData.discount || 0,
      sub_total: orderData.total || 0,
      length: 10, // Default dimensions, should ideally be dynamic
      width: 10,
      height: 10,
      weight: 0.5,
    };

    const result = await createShiprocketOrder(payload);

    // Return the result to be saved in Firestore
    return {
      shiprocketOrderId: result.order_id || null,
      shiprocketShipmentId: result.shipment_id || null,
      shiprocketStatus: result.success ? "NEW" : "FAILED",
      shiprocketError: result.success ? null : result.error,
      shiprocketSyncAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("syncOrderToShiprocket failed:", err);
    return {
      shiprocketStatus: "FAILED",
      shiprocketError: err instanceof Error ? err.message : String(err),
      shiprocketSyncAt: new Date().toISOString(),
    };
  }
}
