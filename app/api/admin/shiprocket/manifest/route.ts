import { NextRequest, NextResponse } from "next/server";
import { generateShiprocketManifest, printShiprocketManifest } from "../../../../lib/shiprocket";

export async function POST(req: NextRequest) {
  try {
    const { shipmentIds } = await req.json();

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json({ error: "Shipment IDs are required" }, { status: 400 });
    }

    // First generate the manifest
    await generateShiprocketManifest(shipmentIds);

    // Then get the print URL
    const manifestUrl = await printShiprocketManifest(shipmentIds);

    return NextResponse.json({ ok: true, manifestUrl });
  } catch (error: any) {
    console.error("API Manifest error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate manifest" }, { status: 500 });
  }
}
