import { NextRequest, NextResponse } from "next/server";
import { getShiprocketLabel } from "../../../../lib/shiprocket";

export async function POST(req: NextRequest) {
  try {
    const { shipmentIds } = await req.json();

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json({ error: "Shipment IDs are required" }, { status: 400 });
    }

    const labelUrl = await getShiprocketLabel(shipmentIds);
    return NextResponse.json({ ok: true, labelUrl });
  } catch (error: any) {
    console.error("API Label error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate label" }, { status: 500 });
  }
}
