import { NextRequest } from "next/server";
import { apiError, apiJson, readUpstreamJson, upstreamError } from "@/app/lib/api/jsonRoute";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const pincode = request.nextUrl.searchParams.get("pincode")?.trim();
  if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
    return apiError("Enter a valid 6-digit Indian pincode.", 400);
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const upstream = await readUpstreamJson(response);
    if (!upstream.ok) {
      return upstreamError("GET /api/pincode", upstream.status, upstream.body);
    }

    const data = upstream.data;
    if (!Array.isArray(data) || data.length === 0) {
      return apiError("Unable to parse pincode details.", 500);
    }

    const result = data[0] as { Status?: string; PostOffice?: Array<Record<string, unknown>> };
    if (result.Status !== "Success" || !Array.isArray(result.PostOffice) || result.PostOffice.length === 0) {
      return apiError("Pincode not found or unsupported for delivery.", 404);
    }

    const office = result.PostOffice[0];
    const location = {
      pincode,
      district: String(office.District || "").trim(),
      city: String(office.Name || office.District || "").trim(),
      state: String(office.State || "").trim(),
      officeName: String(office.Name || "").trim(),
    };

    return apiJson(location);
  } catch (error) {
    console.error("Pincode lookup failed:", error);
    return apiError(
      error instanceof Error ? error.message : "Unable to fetch pincode details.",
      500
    );
  }
}
