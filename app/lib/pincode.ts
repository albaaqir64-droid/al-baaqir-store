export interface PincodeLocation {
  pincode: string;
  city: string;
  state: string;
}

export async function fetchPincodeLocation(pincode: string): Promise<PincodeLocation> {
  const normalized = String(pincode).trim();
  if (!/^[1-9][0-9]{5}$/.test(normalized)) {
    throw new Error("Enter a valid 6-digit Indian pincode.");
  }

  const response = await fetch(`https://api.postalpincode.in/pincode/${normalized}`);
  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Unable to fetch pincode details.");
  }

  const result = data[0];
  if (result.Status !== "Success" || !Array.isArray(result.PostOffice) || result.PostOffice.length === 0) {
    throw new Error("Pincode not found or unsupported for delivery.");
  }

  const office = result.PostOffice[0];
  return {
    pincode: normalized,
    city: String(office.District || office.Name || "Unknown"),
    state: String(office.State || "Unknown"),
  };
}
