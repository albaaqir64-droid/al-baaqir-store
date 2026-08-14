export interface PincodeLocation {
  pincode: string;
  district: string;
  city: string;
  state: string;
  officeName: string;
}

type PostalOffice = Record<string, unknown>;
type PostalApiResult = { PostOffice?: PostalOffice[] };
type PincodeApiLocation = Partial<PincodeLocation>;

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
  // The local route already normalizes the Postal API result into a location
  // object, while the direct API returns an array. Support both responses.
  if (!Array.isArray(data)) {
    const location = data as PincodeApiLocation;
    const city = String(location.city ?? "").trim();
    const state = String(location.state ?? "").trim();
    if (city && state) {
      return {
        pincode: normalized,
        city,
        state,
        district: String(location.district ?? city).trim(),
        officeName: String(location.officeName ?? city).trim(),
      };
    }
    throw new Error("Unable to parse pincode details.");
  }

  // The Postal API returns an array with PostOffice entries. Normalize into a
  // single PincodeLocation that best represents the area. Prefer the first
  // delivery-enabled PostOffice when available.
  const result = data[0] as PostalApiResult | undefined;
  const postOffices = Array.isArray(result?.PostOffice) ? result.PostOffice : [];
  if (!postOffices.length) {
    throw new Error("Pincode not found or unsupported for delivery.");
  }

  // Prefer a Delivery post office if present
  const deliveryOffice = postOffices.find((office) => String(office.DeliveryStatus || '').toLowerCase() === 'delivery');
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
