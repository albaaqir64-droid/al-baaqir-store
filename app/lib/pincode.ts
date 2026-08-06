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

  const location = data as PincodeLocation;
  if (!location.state || !location.district) {
    throw new Error("Pincode not found or unsupported for delivery.");
  }

  return location;
}
