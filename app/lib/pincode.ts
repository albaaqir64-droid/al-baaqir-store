export interface PincodeLocation {
  pincode: string;
  district: string;
  city: string;
  state: string;
  officeName: string;
}

export async function fetchPincodeLocation(pincode: string): Promise<PincodeLocation> {
  const normalized = String(pincode).trim();
  if (!/^[1-9][0-9]{5}$/.test(normalized)) {
    throw new Error("Enter a valid 6-digit Indian pincode.");
  }

  const endpoint = typeof window !== "undefined"
    ? `/api/pincode?pincode=${encodeURIComponent(normalized)}`
    : `https://api.postalpincode.in/pincode/${normalized}`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Unable to fetch pincode details.");
  }

  const data = await response.json();
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Unable to parse pincode details.");
  }

  // The Postal API returns an array with PostOffice entries. Normalize into a
  // single PincodeLocation that best represents the area. Prefer the first
  // delivery-enabled PostOffice when available.
  const result = data[0];
  const postOffices = Array.isArray(result.PostOffice) ? result.PostOffice : [];
  if (!postOffices.length) {
    throw new Error("Pincode not found or unsupported for delivery.");
  }

  // Prefer a Delivery post office if present
  const deliveryOffice = postOffices.find((o: any) => String(o.DeliveryStatus || '').toLowerCase() === 'delivery');
  const office = deliveryOffice || postOffices[0];

  const normalizedLocation: PincodeLocation = {
    pincode: normalized,
    district: String(office.District || '').trim(),
    // city: prefer PostOffice.Name (locality), fall back to District or Division
    city: String(office.Name || office.District || office.Division || '').trim(),
    state: String(office.State || '').trim(),
    officeName: String(office.Name || '').trim(),
  };

  if (!normalizedLocation.state || !normalizedLocation.district) {
    throw new Error("Pincode not found or unsupported for delivery.");
  }

  return normalizedLocation;
}
