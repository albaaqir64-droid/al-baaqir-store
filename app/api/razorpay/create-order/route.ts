import { apiError, apiJson, readRequestJson, readUpstreamJson, upstreamError } from "@/app/lib/api/jsonRoute";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const parsed = await readRequestJson(req);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data as { amount?: number; currency?: string; receipt?: string };
    const { amount, currency = "INR", receipt } = body;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return apiError("Razorpay keys not configured", 500);
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return apiError("A valid payment amount is required", 400);
    }

    const orderPayload = {
      amount,
      currency,
      receipt,
      payment_capture: 1,
    };

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      },
      body: JSON.stringify(orderPayload),
    });

    const upstream = await readUpstreamJson(res);
    if (!upstream.ok) {
      return upstreamError("POST /api/razorpay/create-order", upstream.status, upstream.body);
    }

    if (!res.ok) {
      return apiJson({ success: false, error: upstream.data }, res.status);
    }

    return apiJson({ order: upstream.data, keyId });
  } catch (err) {
    console.error("Razorpay create-order failed:", err);
    return apiError(err instanceof Error ? err.message : String(err), 500);
  }
}
