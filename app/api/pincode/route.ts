import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const pincode = request.nextUrl.searchParams.get("pincode")?.trim();
  if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
    return NextResponse.json({ error: "Enter a valid 6-digit Indian pincode." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    if (!response.ok) {
      return NextResponse.json({ error: "Unable to fetch pincode details." }, { status: 500 });
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Unable to parse pincode details." }, { status: 500 });
    }

    const result = data[0];
    if (result.Status !== "Success" || !Array.isArray(result.PostOffice) || result.PostOffice.length === 0) {
      return NextResponse.json({ error: "Pincode not found or unsupported for delivery." }, { status: 404 });
    }

    const office = result.PostOffice[0];
    const location = {
      pincode,
      district: String(office.District || "").trim(),
      city: String(office.Name || office.District || "").trim(),
      state: String(office.State || "").trim(),
      officeName: String(office.Name || "").trim(),
    };

    return NextResponse.json(location);
  } catch (error) {
    console.error("Pincode lookup failed:", error);
    return NextResponse.json({ error: "Unable to fetch pincode details." }, { status: 500 });
  }
}
