export type PincodeLocation = {
  pincode: string;
  district: string;
  state: string;
  region: string;
  country: string;
};

async function fetchIndiaPostPincodeLocation(pincode: string): Promise<PincodeLocation | null> {
  const normalized = pincode.trim();
  if (!/^\d{6}$/.test(normalized)) {
    return null;
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${normalized}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Array<{
      Status?: string;
      Message?: string;
      PostOffice?: Array<{
        District?: string;
        State?: string;
        Region?: string;
        Circle?: string;
        Country?: string;
      }>;
    }>;

    const entry = data?.[0];
    const postOffice = entry?.PostOffice?.[0];

    if (!entry || entry.Status !== "Success" || !postOffice) {
      return null;
    }

    return {
      pincode: normalized,
      district: postOffice.District || "",
      state: postOffice.State || "",
      region: postOffice.Region || postOffice.Circle || "",
      country: postOffice.Country || "India",
    };
  } catch {
    return null;
  }
}

async function fetchInternalPincodeLocation(pincode: string): Promise<PincodeLocation | null> {
  try {
    const response = await fetch(`/api/pincode/${pincode}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      success?: boolean;
      location?: PincodeLocation;
    };

    if (!data?.success || !data.location) {
      return null;
    }

    return data.location;
  } catch {
    return null;
  }
}

export async function fetchPincodeLocation(pincode: string): Promise<PincodeLocation | null> {
  const normalized = pincode.trim();
  if (!/^\d{6}$/.test(normalized)) {
    return null;
  }

  if (typeof window !== "undefined") {
    return fetchInternalPincodeLocation(normalized);
  }

  return fetchIndiaPostPincodeLocation(normalized);
}
