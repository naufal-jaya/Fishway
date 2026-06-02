const geocodeCache: Record<string, string> = {};

const hardcodedCities: Record<string, string> = {
  "4a9dfa18-9da8-4a6f-970d-3a5edb356ab4": "Bogor",
  "f3466507-88cb-4482-84da-c8869a69616d": "Bogor",
  "68180459-b2e6-4ed7-8055-675c12be41e7": "Bogor",
  "6fe0e865-018b-4cd6-bc0d-3381cd6efafc": "Bogor",
  "ae9e0d09-2799-4cf0-a8d6-b49abf5e61b7": "Bogor",
  "bed32e16-2ea7-4b4d-aab2-dbf0deb0ab31": "Bogor",
  "b1adab9d-c0b8-4915-9175-f996a97b896c": "Subang",
};

export function getShortAddress(address: string | null | undefined): string {
  if (!address) return "";
  const parts = address.split(",").map(p => p.trim());
  if (parts.length === 1) return parts[0];
  for (const part of parts) {
    if (part.toLowerCase().includes("kota ") || part.toLowerCase().includes("kabupaten ") || part.toLowerCase().startsWith("kab. ")) {
      return part;
    }
  }
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const hasNumber = /\d+/.test(last);
    if (parts.length >= 3 && (hasNumber || last.toLowerCase().includes("jawa") || last.toLowerCase().includes("daerah") || last.toLowerCase().includes("provinsi"))) {
      return parts[parts.length - 2];
    }
    return parts[parts.length - 2] || parts[0];
  }
  return parts[0];
}

export async function getCityFromCoords(
  storeId: string | null | undefined,
  lat: number | null | undefined,
  lon: number | null | undefined,
  fallbackAddress: string
): Promise<string> {
  // 1. Check hardcoded dictionary first
  if (storeId && hardcodedCities[storeId]) {
    return hardcodedCities[storeId];
  }

  if (lat == null || lon == null) {
    return getShortAddress(fallbackAddress) || "Lokasi tidak diketahui";
  }

  // 2. Check local memory cache
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (geocodeCache[cacheKey]) {
    return geocodeCache[cacheKey];
  }

  // 3. Try to call Google Geocoding API
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return getShortAddress(fallbackAddress) || "Lokasi tidak diketahui";
    }

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`,
      { next: { revalidate: 86400 } } // Cache in NextJS for 1 day
    );
    const data = await res.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      let city = "";
      for (const result of data.results) {
        for (const component of result.address_components) {
          if (component.types.includes("administrative_area_level_2")) {
            city = component.long_name;
            break;
          }
        }
        if (city) break;
      }
      
      if (!city) {
        for (const result of data.results) {
          for (const component of result.address_components) {
            if (component.types.includes("locality") || component.types.includes("administrative_area_level_1")) {
              city = component.long_name;
              break;
            }
          }
          if (city) break;
        }
      }

      if (city) {
        const cleanCity = city.replace(/^(Kota|Kabupaten|Kab\.)\s+/i, "");
        geocodeCache[cacheKey] = cleanCity;
        return cleanCity;
      }
    }
  } catch (err) {
    console.error("Geocoding error:", err);
  }

  // 4. Fallback to address parsing
  const shortAddr = getShortAddress(fallbackAddress);
  if (shortAddr) {
    geocodeCache[cacheKey] = shortAddr;
    return shortAddr;
  }
  return "Lokasi tidak diketahui";
}
