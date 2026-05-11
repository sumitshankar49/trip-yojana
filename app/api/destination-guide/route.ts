import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import foodsByState from "@/packages/constants/famous-foods-by-state.json";

export const runtime = "nodejs";

type Coordinates = { lat: number; lng: number };
type NamedCenter = { name: string; coords: Coordinates };

type DayPlan = {
  day: number;
  focus: string;
  places: string[];
};

type FoodGuideItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string;
};

type DiscoverItem = {
  id: string;
  name: string;
  category: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  address: string;
  imageUrl: string | null;
  mapUrl: string;
  source: "geoapify" | "overpass" | "wikipedia" | "nominatim";
};

type DestinationGuideResponse = {
  destination: {
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
  };
  overview: string;
  heroImageUrl: string | null;
  places: DiscoverItem[];
  shopping: DiscoverItem[];
  famousFoods: FoodGuideItem[];
  tips: string[];
  famousPlaces: string[];
  shoppingHighlights: string[];
  popularFoodSpots: string[];
  threeDayPlan: DayPlan[];
};

type WikiSummary = {
  extract: string;
  imageUrl: string | null;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary";
const INDIA_POST_URL = "https://api.postalpincode.in/pincode";

const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY || "";
const FOOD_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"] as const;
const FOOD_IMAGE_FALLBACK = "/foods/fallback-food.jpg";
const foodImageLookupCache = new Map<string, string>();
const foodImageDirectoryIndexCache = new Map<string, Map<string, string>>();

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const isValidPincode = (value: string) => /^\d{6}$/.test(value.trim());

function slugifyName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function normalizeAssetKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildDirectoryImageIndex(absoluteDir: string, webPrefix: string): Map<string, string> {
  const cached = foodImageDirectoryIndexCache.get(absoluteDir);
  if (cached) {
    return cached;
  }

  const index = new Map<string, string>();
  if (!fs.existsSync(absoluteDir)) {
    foodImageDirectoryIndexCache.set(absoluteDir, index);
    return index;
  }

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).replace(".", "").toLowerCase();
    if (!FOOD_IMAGE_EXTENSIONS.includes(ext as (typeof FOOD_IMAGE_EXTENSIONS)[number])) {
      continue;
    }

    const baseName = path.basename(entry.name, path.extname(entry.name));
    const key = normalizeAssetKey(baseName);
    if (!key || index.has(key)) {
      continue;
    }

    index.set(key, `${webPrefix}/${entry.name}`);
  }

  foodImageDirectoryIndexCache.set(absoluteDir, index);
  return index;
}

function findImageInDirectory(absoluteDir: string, webPrefix: string, slug: string, normalizedFoodKey: string): string | null {
  for (const ext of FOOD_IMAGE_EXTENSIONS) {
    const filename = `${slug}.${ext}`;
    const absolutePath = path.join(absoluteDir, filename);
    if (fs.existsSync(absolutePath)) {
      return `${webPrefix}/${filename}`;
    }
  }

  const index = buildDirectoryImageIndex(absoluteDir, webPrefix);
  return index.get(normalizedFoodKey) || null;
}

function getFoodImagePath(foodName: string, state: string): string {
  const slug = slugifyName(foodName);
  const stateSlug = slugifyName(normalizeStateName(state));
  const normalizedFoodKey = normalizeAssetKey(foodName);
  const cacheKey = `${stateSlug}:${slug}`;
  const cached = foodImageLookupCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const foodsRootDir = path.join(process.cwd(), "public", "foods");
  if (stateSlug && stateSlug !== "unknown-state") {
    const stateDir = path.join(foodsRootDir, stateSlug);
    const stateImage = findImageInDirectory(stateDir, `/foods/${stateSlug}`, slug, normalizedFoodKey);
    if (stateImage) {
      foodImageLookupCache.set(cacheKey, stateImage);
      return stateImage;
    }
  }

  const rootImage = findImageInDirectory(foodsRootDir, "/foods", slug, normalizedFoodKey);
  if (rootImage) {
    foodImageLookupCache.set(cacheKey, rootImage);
    return rootImage;
  }

  foodImageLookupCache.set(cacheKey, FOOD_IMAGE_FALLBACK);
  return FOOD_IMAGE_FALLBACK;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineKm(start: Coordinates, end: Coordinates): number {
  const earthRadiusKm = 6371;
  const latDelta = toRad(end.lat - start.lat);
  const lngDelta = toRad(end.lng - start.lng);
  const lat1 = toRad(start.lat);
  const lat2 = toRad(end.lat);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadiusKm * c).toFixed(1));
}

function normalizeStateName(state: string): string {
  return normalizeText(state)
    .replace(/^state of\s+/i, "")
    .replace(/\s+state$/i, "");
}

async function fetchPincodeContext(pincode: string): Promise<{
  city: string;
  district: string;
  state: string;
  country: string;
} | null> {
  if (!isValidPincode(pincode)) {
    return null;
  }

  try {
    const response = await fetch(`${INDIA_POST_URL}/${pincode}`, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Array<{
      Status?: string;
      PostOffice?: Array<{
        Name?: string;
        District?: string;
        State?: string;
        Country?: string;
      }>;
    }>;

    const office = data?.[0]?.PostOffice?.[0];
    if (!office) {
      return null;
    }

    return {
      city: normalizeText(office.Name || office.District || ""),
      district: normalizeText(office.District || ""),
      state: normalizeText(office.State || ""),
      country: normalizeText(office.Country || "India"),
    };
  } catch {
    return null;
  }
}

function isCityLevelResult(
  result: {
    address?: {
      city?: string;
      town?: string;
      village?: string;
      county?: string;
      state?: string;
      district?: string;
      country?: string;
    };
  },
  desiredCity: string,
  desiredState?: string
): boolean {
  const resultCity = normalizeText(result.address?.city || result.address?.town || result.address?.village || "").toLowerCase();
  const resultState = normalizeText(result.address?.state || "").toLowerCase();
  const resultDistrict = normalizeText(result.address?.district || "").toLowerCase();
  const resultCounty = normalizeText(result.address?.county || "").toLowerCase();
  const queryCity = normalizeText(desiredCity).toLowerCase();
  const queryState = desiredState ? normalizeText(desiredState).toLowerCase() : "";

  // If we have a state in query, check that result matches that state
  if (queryState && resultState && resultState !== queryState) {
    return false;
  }

  // Direct city/town/village match.
  const isExactMatch = resultCity === queryCity;
  const isPartialMatch = queryCity.includes(resultCity) || resultCity.includes(queryCity);
  if (resultCity && (isExactMatch || isPartialMatch)) {
    return true;
  }

  // District/county fallback for destinations entered as districts (e.g., Bhojpur).
  const districtExact = resultDistrict === queryCity || resultCounty === queryCity;
  const districtPartial =
    (resultDistrict && (queryCity.includes(resultDistrict) || resultDistrict.includes(queryCity))) ||
    (resultCounty && (queryCity.includes(resultCounty) || resultCounty.includes(queryCity)));

  return districtExact || Boolean(districtPartial);
}

async function geocodeDestination(destination: string, pincode?: string, allowLooseMatch = false): Promise<{
  city: string;
  state: string;
  country: string;
  coords: Coordinates;
} | null> {
  const destinationIsPin = isValidPincode(destination);
  const queries = isValidPincode(pincode || "")
    ? [`${destination}, ${pincode}, India`, `${pincode}, India`, destination]
    : [destination];

  for (const query of queries) {
    const url = `${NOMINATIM_URL}?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "TripYojana/1.0 (city-discovery)" },
      cache: "no-store",
    });

    if (!response.ok) {
      continue;
    }

    const data = (await response.json()) as Array<{
      lat: string;
      lon: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        county?: string;
        state?: string;
        district?: string;
        country?: string;
      };
    }>;

    // Find first acceptable result. For pincode-only input, accept first valid geo hit.
    for (const result of data) {
      if (!allowLooseMatch && !destinationIsPin && !isCityLevelResult(result, destination)) {
        continue;
      }

      const lat = Number(result.lat);
      const lng = Number(result.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }

      return {
        city: normalizeText(
          result.address?.city ||
            result.address?.town ||
            result.address?.village ||
            result.address?.district ||
            result.address?.county ||
            destination
        ),
        state: normalizeText(result.address?.state || "Unknown State"),
        country: normalizeText(result.address?.country || "India"),
        coords: { lat, lng },
      };
    }
  }

  return null;
}

async function fetchWikipediaSummary(city: string, state: string): Promise<WikiSummary> {
  // Try multiple candidates in order of specificity
  const candidates = [
    `${city}, ${state}`,
    `${city} (city)`,
    `${city}`,
  ];

  for (const title of candidates) {
    const normalizedTitle = title.replace(/\s+/g, "_");
    const response = await fetch(`${WIKIPEDIA_SUMMARY_URL}/${encodeURIComponent(normalizedTitle)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      continue;
    }

    const data = (await response.json()) as {
      extract?: string;
      thumbnail?: { source?: string };
      title?: string;
    };

    const overview = normalizeText(data.extract || "");
    if (!overview) {
      continue;
    }

    // Validate that the returned article is about the city, not a generic state article
    const returnedTitle = normalizeText(data.title || "").toLowerCase();
    const cityLower = city.toLowerCase();
    const stateLower = state.toLowerCase();

    // If returned title is just the state name, skip it
    if (returnedTitle === stateLower) {
      continue;
    }

    // If returned title doesn't contain the city name, it's likely a state/district article
    if (!returnedTitle.includes(cityLower)) {
      continue;
    }

    return {
      extract: overview,
      imageUrl: data.thumbnail?.source || null,
    };
  }

  // Return minimal fallback if no city-specific Wikipedia data found
  return {
    extract: `${city} is a city in ${state}. Local attractions, food culture, and shopping experiences await visitors.`,
    imageUrl: null,
  };
}

async function fetchWikipediaImages(titles: string[]): Promise<Record<string, string>> {
  const cleaned = Array.from(new Set(titles.map((title) => normalizeText(title)).filter(Boolean))).slice(0, 15);
  if (cleaned.length === 0) {
    return {};
  }

  const titlesParam = cleaned.join("|");
  const url = `${WIKIPEDIA_SEARCH_URL}?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=600&titles=${encodeURIComponent(titlesParam)}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    return {};
  }

  const data = (await response.json()) as {
    query?: {
      pages?: Record<string, { title?: string; thumbnail?: { source?: string } }>;
    };
  };

  const images: Record<string, string> = {};
  for (const page of Object.values(data.query?.pages || {})) {
    const title = normalizeText(page.title || "");
    const image = page.thumbnail?.source || "";
    if (title && image) {
      images[title.toLowerCase()] = image;
    }
  }

  return images;
}

async function fetchGeoapifyItems(center: Coordinates, categories: string, limit: number): Promise<DiscoverItem[]> {
  if (!GEOAPIFY_KEY) {
    return [];
  }

  const params = new URLSearchParams({
    categories,
    filter: `circle:${center.lng},${center.lat},30000`,
    bias: `proximity:${center.lng},${center.lat}`,
    limit: String(limit),
    lang: "en",
    apiKey: GEOAPIFY_KEY,
  });

  const response = await fetch(`https://api.geoapify.com/v2/places?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    features?: Array<{
      properties?: {
        place_id?: string;
        name?: string;
        formatted?: string;
        address_line2?: string;
        categories?: string[];
      };
      geometry?: {
        coordinates?: [number, number];
      };
    }>;
  };

  const items: DiscoverItem[] = [];
  const seen = new Set<string>();

  for (const feature of data.features || []) {
    const name = normalizeText(feature.properties?.name || "");
    if (!name || seen.has(name.toLowerCase())) {
      continue;
    }

    const coordinates = feature.geometry?.coordinates;
    const lng = coordinates?.[0];
    const lat = coordinates?.[1];

    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const location = hasCoords ? { lat: lat as number, lng: lng as number } : null;

    seen.add(name.toLowerCase());

    items.push({
      id: feature.properties?.place_id || `geo-${slugifyName(name)}`,
      name,
      category: normalizeText((feature.properties?.categories || ["place"])[0] || "place"),
      lat: location?.lat || null,
      lng: location?.lng || null,
      distanceKm: location ? haversineKm(center, location) : null,
      address: normalizeText(feature.properties?.address_line2 || feature.properties?.formatted || ""),
      imageUrl: null,
      mapUrl: location
        ? `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
      source: "geoapify",
    });

    if (items.length >= limit) {
      break;
    }
  }

  return items;
}

async function fetchNominatimFallbackItems(
  destination: { city: string; state: string; country: string; coords: Coordinates },
  mode: "places" | "shopping",
  limit = 10
): Promise<DiscoverItem[]> {
  const terms =
    mode === "places"
      ? ["tourist attraction", "museum", "temple", "historic site", "monument"]
      : ["shopping mall", "market", "bazaar", "department store", "marketplace"];

  const allowedClass = mode === "places" ? new Set(["tourism", "historic", "amenity", "leisure"]) : new Set(["shop", "amenity"]);
  const attractionKeywords = [
    "temple",
    "fort",
    "museum",
    "park",
    "ghat",
    "palace",
    "monument",
    "mandir",
    "mosque",
    "church",
    "stupa",
    "cave",
    "waterfall",
    "ashram",
    "zoo",
  ];

  const excludeKeywords = [
    "police",
    "government",
    "ministry",
    "office",
    "department",
    "school",
    "college",
    "university",
    "institute",
    "board",
  ];

  const items: DiscoverItem[] = [];
  const seen = new Set<string>();

  for (const term of terms) {
    const query = `${term} near ${destination.city}, ${destination.state}, ${destination.country}`;
    const url = `${NOMINATIM_URL}?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: { "User-Agent": "TripYojana/1.0 (city-discovery)" },
      cache: "no-store",
    });

    if (!response.ok) {
      continue;
    }

    const data = (await response.json()) as Array<{
      place_id?: number;
      display_name?: string;
      lat?: string;
      lon?: string;
      class?: string;
      type?: string;
      name?: string;
    }>;

    for (const entry of data || []) {
      const name = normalizeText(entry.name || (entry.display_name || "").split(",")[0] || "");
      if (!name || seen.has(name.toLowerCase())) {
        continue;
      }

      const nameLower = name.toLowerCase();
      if (excludeKeywords.some((kw) => nameLower.includes(kw))) {
        continue;
      }

      const entryClass = normalizeText(entry.class || "").toLowerCase();
      const entryType = normalizeText(entry.type || "").toLowerCase();
      const looksLikeAttraction = attractionKeywords.some((keyword) => nameLower.includes(keyword) || entryType.includes(keyword));

      if (mode === "places") {
        const rejectedClass = new Set(["boundary", "administrative", "highway", "railway", "waterway"]);
        if (rejectedClass.has(entryClass)) {
          continue;
        }

        // Keep high-confidence classes, or POIs that look like attractions by name/type.
        if (entryClass && !allowedClass.has(entryClass) && !looksLikeAttraction) {
          continue;
        }
      } else if (entryClass && !allowedClass.has(entryClass)) {
        continue;
      }

      const lat = Number(entry.lat);
      const lng = Number(entry.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }

      const location = { lat, lng };
      seen.add(name.toLowerCase());

      items.push({
        id: `nom-${mode}-${entry.place_id || slugifyName(name)}`,
        name,
        category: normalizeText(entryType || (mode === "places" ? "landmark" : "shopping")),
        lat,
        lng,
        distanceKm: haversineKm(destination.coords, location),
        address: normalizeText(entry.display_name || "Nearby"),
        imageUrl: null,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        source: "nominatim",
      });

      if (items.length >= limit) {
        break;
      }
    }

    if (items.length >= limit) {
      break;
    }
  }

  return items.slice(0, limit);
}

async function queryOverpass(overpassQuery: string): Promise<{
  elements?: Array<{
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }>;
} | null> {
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body: `data=${encodeURIComponent(overpassQuery)}`,
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as {
    elements?: Array<{
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };
}

async function fetchNearbyTownCenters(center: Coordinates, radiusMeters = 120000): Promise<NamedCenter[]> {
  const query = `
[out:json][timeout:30];
(
  node["place"~"city|town|suburb"](around:${radiusMeters},${center.lat},${center.lng});
  way["place"~"city|town|suburb"](around:${radiusMeters},${center.lat},${center.lng});
  relation["place"~"city|town|suburb"](around:${radiusMeters},${center.lat},${center.lng});
);
out center tags 30;
`;

  const data = await queryOverpass(query);
  const centers: NamedCenter[] = [];
  const seen = new Set<string>();

  for (const element of data?.elements || []) {
    const name = normalizeText(element.tags?.name || "");
    if (!name || seen.has(name.toLowerCase())) {
      continue;
    }

    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const coords = { lat: lat as number, lng: lng as number };
    seen.add(name.toLowerCase());
    centers.push({ name, coords });
  }

  return centers
    .sort((a, b) => haversineKm(center, a.coords) - haversineKm(center, b.coords))
    .slice(0, 6);
}

async function fetchNearbyNominatimCenters(city: string, state: string, country: string): Promise<NamedCenter[]> {
  const queries = [`cities near ${city}, ${state}, ${country}`, `${city}, ${state}, ${country}`];
  const seen = new Set<string>();
  const results: NamedCenter[] = [];

  for (const query of queries) {
    const url = `${NOMINATIM_URL}?format=json&addressdetails=1&limit=12&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "TripYojana/1.0 (city-discovery)" },
      cache: "no-store",
    });

    if (!response.ok) {
      continue;
    }

    const data = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
      name?: string;
      class?: string;
      type?: string;
      address?: { city?: string; town?: string; village?: string; county?: string; state?: string };
      display_name?: string;
    }>;

    for (const item of data || []) {
      const placeType = normalizeText(item.type || "").toLowerCase();
      const placeClass = normalizeText(item.class || "").toLowerCase();
      if (placeClass === "boundary" || placeType === "administrative") {
        continue;
      }

      const name = normalizeText(
        item.address?.city || item.address?.town || item.address?.village || item.address?.county || item.name || ""
      );
      if (!name || seen.has(name.toLowerCase())) {
        continue;
      }

      const lat = Number(item.lat);
      const lng = Number(item.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }

      seen.add(name.toLowerCase());
      results.push({ name, coords: { lat, lng } });

      if (results.length >= 8) {
        break;
      }
    }

    if (results.length >= 8) {
      break;
    }
  }

  return results;
}

async function fetchOverpassAttractions(center: Coordinates): Promise<DiscoverItem[]> {
  const primaryRadius = 20000;
  const nearbyRadius = 70000;

  // Primary query: tourism & historic attractions
  const primaryQuery = `
[out:json][timeout:30];
(
  node["tourism"~"attraction|museum|gallery|theme_park|zoo|viewpoint|artwork"](around:${primaryRadius},${center.lat},${center.lng});
  way["tourism"~"attraction|museum|gallery|theme_park|zoo|viewpoint|artwork"](around:${primaryRadius},${center.lat},${center.lng});
  relation["tourism"~"attraction|museum|gallery|theme_park|zoo|viewpoint|artwork"](around:${primaryRadius},${center.lat},${center.lng});
  node["historic"~"monument|memorial|archaeological_site|castle|fort|temple"](around:${primaryRadius},${center.lat},${center.lng});
  way["historic"~"monument|memorial|archaeological_site|castle|fort|temple"](around:${primaryRadius},${center.lat},${center.lng});
);
out center tags 100;
`;

  let data = await queryOverpass(primaryQuery);
  const items: DiscoverItem[] = [];
  const seen = new Set<string>();

  // Keywords to exclude from Overpass results
  const excludeKeywords = [
    "police", "assembly", "legislature", "parliament", "court", "judicial",
    "government", "ministry", "office", "department", "agency", "authority",
    "school", "college", "university", "institute", "board"
  ];

  // Process primary results
  for (const element of data?.elements || []) {
    const name = normalizeText(element.tags?.name || "");
    if (!name || seen.has(name.toLowerCase())) {
      continue;
    }

    const nameLower = name.toLowerCase();

    // Skip generic names
    if (/^(landmark|monument|building|structure)$/i.test(name)) {
      continue;
    }

    // Skip institutional results
    if (excludeKeywords.some(kw => nameLower.includes(kw))) {
      continue;
    }

    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const location = { lat: lat as number, lng: lng as number };
    seen.add(name.toLowerCase());

    items.push({
      id: `osm-${slugifyName(name)}`,
      name,
      category: normalizeText(element.tags?.tourism || element.tags?.historic || "landmark"),
      lat: location.lat,
      lng: location.lng,
      distanceKm: haversineKm(center, location),
      address: "",
      imageUrl: null,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
      source: "overpass",
    });
  }

  // If primary query returned few results, try secondary query with broader tags.
  // This keeps results relevant while still helping low-coverage districts like Bhojpur.
  if (items.length < 5) {
    const secondaryQuery = `
[out:json][timeout:30];
(
  node["name"]["name"!=""](around:${primaryRadius},${center.lat},${center.lng});
  node["place"~"square|village_green"](around:${primaryRadius},${center.lat},${center.lng});
  node["amenity"~"place_of_worship|library|museum"](around:${primaryRadius},${center.lat},${center.lng});
  way["amenity"~"place_of_worship|library|museum"](around:${primaryRadius},${center.lat},${center.lng});
);
out center tags 100;
`;

    data = await queryOverpass(secondaryQuery);

    for (const element of data?.elements || []) {
      const name = normalizeText(element.tags?.name || "");
      if (!name || seen.has(name.toLowerCase())) {
        continue;
      }

      const nameLower = name.toLowerCase();

      if (/^(landmark|monument|building|structure|shop|office|store)$/i.test(name)) {
        continue;
      }

      // Skip institutional results in secondary query too
      if (excludeKeywords.some(kw => nameLower.includes(kw))) {
        continue;
      }

      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }

      const location = { lat: lat as number, lng: lng as number };
      seen.add(name.toLowerCase());

      items.push({
        id: `osm-${slugifyName(name)}`,
        name,
        category: normalizeText(element.tags?.tourism || element.tags?.amenity || element.tags?.place || "landmark"),
        lat: location.lat,
        lng: location.lng,
        distanceKm: haversineKm(center, location),
        address: "",
        imageUrl: null,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
        source: "overpass",
      });

      if (items.length >= 12) {
        break;
      }
    }
  }

  // Nearby fallback: expand radius if we still have very few results.
  if (items.length < 3) {
    const nearbyQuery = `
[out:json][timeout:35];
(
  node["tourism"~"attraction|museum|gallery|viewpoint|artwork"](around:${nearbyRadius},${center.lat},${center.lng});
  way["tourism"~"attraction|museum|gallery|viewpoint|artwork"](around:${nearbyRadius},${center.lat},${center.lng});
  node["historic"~"monument|memorial|archaeological_site|castle|fort|temple"](around:${nearbyRadius},${center.lat},${center.lng});
  way["historic"~"monument|memorial|archaeological_site|castle|fort|temple"](around:${nearbyRadius},${center.lat},${center.lng});
);
out center tags 120;
`;

    data = await queryOverpass(nearbyQuery);

    for (const element of data?.elements || []) {
      const name = normalizeText(element.tags?.name || "");
      if (!name || seen.has(name.toLowerCase())) {
        continue;
      }

      const nameLower = name.toLowerCase();
      if (/^(landmark|monument|building|structure|shop|office|store)$/i.test(name)) {
        continue;
      }
      if (excludeKeywords.some((kw) => nameLower.includes(kw))) {
        continue;
      }

      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }

      const location = { lat: lat as number, lng: lng as number };
      seen.add(name.toLowerCase());

      items.push({
        id: `osm-nearby-${slugifyName(name)}`,
        name,
        category: normalizeText(element.tags?.tourism || element.tags?.historic || "nearby-landmark"),
        lat: location.lat,
        lng: location.lng,
        distanceKm: haversineKm(center, location),
        address: "Nearby",
        imageUrl: null,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
        source: "overpass",
      });

      if (items.length >= 12) {
        break;
      }
    }
  }

  if (items.length < 3) {
    const nearbyCenters = await fetchNearbyTownCenters(center);

    for (const nearbyCenter of nearbyCenters) {
      const nearbyTownQuery = `
[out:json][timeout:35];
(
  node["tourism"~"attraction|museum|gallery|viewpoint|artwork"](around:15000,${nearbyCenter.coords.lat},${nearbyCenter.coords.lng});
  way["tourism"~"attraction|museum|gallery|viewpoint|artwork"](around:15000,${nearbyCenter.coords.lat},${nearbyCenter.coords.lng});
  node["historic"~"monument|memorial|archaeological_site|castle|fort|temple"](around:15000,${nearbyCenter.coords.lat},${nearbyCenter.coords.lng});
  way["historic"~"monument|memorial|archaeological_site|castle|fort|temple"](around:15000,${nearbyCenter.coords.lat},${nearbyCenter.coords.lng});
);
out center tags 100;
`;

      const nearbyData = await queryOverpass(nearbyTownQuery);
      for (const element of nearbyData?.elements || []) {
        const name = normalizeText(element.tags?.name || "");
        if (!name || seen.has(name.toLowerCase())) {
          continue;
        }

        const nameLower = name.toLowerCase();
        if (/^(landmark|monument|building|structure|shop|office|store)$/i.test(name)) {
          continue;
        }
        if (excludeKeywords.some((kw) => nameLower.includes(kw))) {
          continue;
        }

        const lat = element.lat ?? element.center?.lat;
        const lng = element.lon ?? element.center?.lon;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          continue;
        }

        const location = { lat: lat as number, lng: lng as number };
        seen.add(name.toLowerCase());

        items.push({
          id: `osm-nearby-town-${slugifyName(name)}`,
          name,
          category: normalizeText(element.tags?.tourism || element.tags?.historic || "nearby-landmark"),
          lat: location.lat,
          lng: location.lng,
          distanceKm: haversineKm(center, location),
          address: `Nearby ${nearbyCenter.name}`,
          imageUrl: null,
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
          source: "overpass",
        });

        if (items.length >= 12) {
          break;
        }
      }

      if (items.length >= 12) {
        break;
      }
    }
  }

  return items.slice(0, 12);
}

async function fetchOverpassShopping(center: Coordinates): Promise<DiscoverItem[]> {
  const primaryRadius = 15000;
  const nearbyRadius = 70000;

  const query = `
[out:json][timeout:30];
(
  node["amenity"="marketplace"](around:${primaryRadius},${center.lat},${center.lng});
  way["amenity"="marketplace"](around:${primaryRadius},${center.lat},${center.lng});
  node["shop"~"mall|department_store|boutique|jewelry|clothes|handicraft|gift"](around:${primaryRadius},${center.lat},${center.lng});
  way["shop"~"mall|department_store|boutique|jewelry|clothes|handicraft|gift"](around:${primaryRadius},${center.lat},${center.lng});
);
out center tags 100;
`;

  const data = await queryOverpass(query);
  const items: DiscoverItem[] = [];
  const seen = new Set<string>();

  for (const element of data?.elements || []) {
    const name = normalizeText(element.tags?.name || "");
    if (!name || seen.has(name.toLowerCase())) {
      continue;
    }

    // Skip generic shop names
    if (/^(shop|store|market)$/i.test(name)) {
      continue;
    }

    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const location = { lat: lat as number, lng: lng as number };
    seen.add(name.toLowerCase());

    items.push({
      id: `shop-${slugifyName(name)}`,
      name,
      category: normalizeText(element.tags?.shop || element.tags?.amenity || "shopping"),
      lat: location.lat,
      lng: location.lng,
      distanceKm: haversineKm(center, location),
      address: "",
      imageUrl: null,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
      source: "overpass",
    });

    if (items.length >= 12) {
      break;
    }
  }

  if (items.length < 3) {
    const nearbyQuery = `
[out:json][timeout:35];
(
  node["amenity"="marketplace"](around:${nearbyRadius},${center.lat},${center.lng});
  way["amenity"="marketplace"](around:${nearbyRadius},${center.lat},${center.lng});
  node["shop"~"mall|department_store|boutique|jewelry|clothes|handicraft|gift|supermarket"](around:${nearbyRadius},${center.lat},${center.lng});
  way["shop"~"mall|department_store|boutique|jewelry|clothes|handicraft|gift|supermarket"](around:${nearbyRadius},${center.lat},${center.lng});
);
out center tags 120;
`;

    const nearbyData = await queryOverpass(nearbyQuery);
    for (const element of nearbyData?.elements || []) {
      const name = normalizeText(element.tags?.name || "");
      if (!name || seen.has(name.toLowerCase())) {
        continue;
      }

      if (/^(shop|store|market)$/i.test(name)) {
        continue;
      }

      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }

      const location = { lat: lat as number, lng: lng as number };
      seen.add(name.toLowerCase());

      items.push({
        id: `shop-nearby-${slugifyName(name)}`,
        name,
        category: normalizeText(element.tags?.shop || element.tags?.amenity || "nearby-shopping"),
        lat: location.lat,
        lng: location.lng,
        distanceKm: haversineKm(center, location),
        address: "Nearby",
        imageUrl: null,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
        source: "overpass",
      });

      if (items.length >= 12) {
        break;
      }
    }
  }

  if (items.length < 3) {
    const nearbyCenters = await fetchNearbyTownCenters(center);

    for (const nearbyCenter of nearbyCenters) {
      const nearbyTownQuery = `
[out:json][timeout:35];
(
  node["amenity"="marketplace"](around:15000,${nearbyCenter.coords.lat},${nearbyCenter.coords.lng});
  way["amenity"="marketplace"](around:15000,${nearbyCenter.coords.lat},${nearbyCenter.coords.lng});
  node["shop"~"mall|department_store|boutique|jewelry|clothes|handicraft|gift|supermarket"](around:15000,${nearbyCenter.coords.lat},${nearbyCenter.coords.lng});
  way["shop"~"mall|department_store|boutique|jewelry|clothes|handicraft|gift|supermarket"](around:15000,${nearbyCenter.coords.lat},${nearbyCenter.coords.lng});
);
out center tags 100;
`;

      const nearbyData = await queryOverpass(nearbyTownQuery);
      for (const element of nearbyData?.elements || []) {
        const name = normalizeText(element.tags?.name || "");
        if (!name || seen.has(name.toLowerCase())) {
          continue;
        }

        if (/^(shop|store|market)$/i.test(name)) {
          continue;
        }

        const lat = element.lat ?? element.center?.lat;
        const lng = element.lon ?? element.center?.lon;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          continue;
        }

        const location = { lat: lat as number, lng: lng as number };
        seen.add(name.toLowerCase());

        items.push({
          id: `shop-nearby-town-${slugifyName(name)}`,
          name,
          category: normalizeText(element.tags?.shop || element.tags?.amenity || "nearby-shopping"),
          lat: location.lat,
          lng: location.lng,
          distanceKm: haversineKm(center, location),
          address: `Nearby ${nearbyCenter.name}`,
          imageUrl: null,
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
          source: "overpass",
        });

        if (items.length >= 12) {
          break;
        }
      }

      if (items.length >= 12) {
        break;
      }
    }
  }

  return items.slice(0, 12);
}

async function fetchFoodSpots(center: Coordinates): Promise<string[]> {
  const query = `
[out:json][timeout:30];
(
  node["amenity"~"restaurant|cafe|fast_food"](around:12000,${center.lat},${center.lng});
  way["amenity"~"restaurant|cafe|fast_food"](around:12000,${center.lat},${center.lng});
  relation["amenity"~"restaurant|cafe|fast_food"](around:12000,${center.lat},${center.lng});
);
out center tags 100;
`;

  const data = await queryOverpass(query);
  const spots: string[] = [];
  const seen = new Set<string>();

  for (const element of data?.elements || []) {
    const name = normalizeText(element.tags?.name || "");
    if (!name || seen.has(name.toLowerCase())) {
      continue;
    }

    // Skip generic food spot names
    if (/^(restaurant|cafe|food|shop|store)$/i.test(name)) {
      continue;
    }

    seen.add(name.toLowerCase());
    spots.push(name);

    if (spots.length >= 10) {
      break;
    }
  }

  return spots;
}

function getFamousFoodsByState(state: string): string[] {
  const normalizedInput = normalizeStateName(state).toLowerCase();
  const entries = Object.entries(foodsByState as Record<string, string[]>);

  const exact = entries.find(([key]) => normalizeStateName(key).toLowerCase() === normalizedInput);
  if (exact) {
    return exact[1].slice(0, 8);
  }

  const contains = entries.find(([key]) => {
    const normalizedKey = normalizeStateName(key).toLowerCase();
    return normalizedInput.includes(normalizedKey) || normalizedKey.includes(normalizedInput);
  });

  return contains ? contains[1].slice(0, 8) : [];
}

function getFoodDescription(foodName: string, state: string): string {
  const lower = foodName.toLowerCase();

  if (/biryani/.test(lower)) {
    return `A fragrant rice specialty from ${state}, layered with bold spices.`;
  }
  if (/curry|mas|ghanta|thongba/.test(lower)) {
    return `A savory ${state} curry known for regional spice blends and depth.`;
  }
  if (/jalebi|poda|sweet|meetha|kheer|khaja|ghevar|rosogolla|poli|pak/.test(lower)) {
    return `A beloved sweet from ${state}, often served during festive moments.`;
  }
  if (/dosa|idli|paratha|roti|kulcha|bhature|appam|parotta/.test(lower)) {
    return `A classic ${state} staple that travelers love for comfort and flavor.`;
  }

  return `A popular regional specialty from ${state}, loved by locals and travelers.`;
}

function buildFoodGuideItems(state: string): FoodGuideItem[] {
  return getFamousFoodsByState(state).map((food) => ({
    id: `food-${slugifyName(food)}`,
    name: food,
    imageUrl: getFoodImagePath(food, state),
    description: getFoodDescription(food, state),
  }));
}

function dedupeByName(items: DiscoverItem[]): DiscoverItem[] {
  const seen = new Set<string>();
  const unique: DiscoverItem[] = [];

  for (const item of items) {
    const key = item.name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(item);
  }

  return unique;
}

function buildTips(city: string, attractionsCount: number, foodCount: number): string[] {
  return [
    `Start in central ${city} and group nearby places together to reduce transit time.`,
    `Keep 2-4 attraction stops per day for a relaxed and practical itinerary.`,
    `Try at least one local food spot each day (${foodCount} nearby spots identified).`,
    attractionsCount === 0
      ? "Add your own custom places if attraction data is low for this destination."
      : "Use the map button on each card to preview exact location before adding.",
  ];
}

function chunkPlaces(names: string[], days: number): DayPlan[] {
  const normalizedDays = Math.max(1, Math.min(days, 7));
  const selected = names.slice(0, normalizedDays * 4);

  if (selected.length === 0) {
    return Array.from({ length: normalizedDays }, (_, index) => ({
      day: index + 1,
      focus: "Flexible exploration",
      places: [],
    }));
  }

  const size = Math.ceil(selected.length / normalizedDays);
  return Array.from({ length: normalizedDays }, (_, index) => ({
    day: index + 1,
    focus: "Local highlights",
    places: selected.slice(index * size, (index + 1) * size),
  }));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawDestination = normalizeText(searchParams.get("destination") || "");
    const rawPincode = normalizeText(searchParams.get("pincode") || "");
    const days = Number(searchParams.get("days") || "3");

    if (!rawDestination) {
      return NextResponse.json({ error: "Destination is required" }, { status: 400 });
    }

    const destinationIsPincode = isValidPincode(rawDestination);
    const resolvedPincode = isValidPincode(rawPincode)
      ? rawPincode
      : destinationIsPincode
      ? rawDestination
      : "";

    const pincodeContext = resolvedPincode ? await fetchPincodeContext(resolvedPincode) : null;

    const destinationQuery = destinationIsPincode
      ? pincodeContext?.district || pincodeContext?.state || pincodeContext?.city || rawDestination
      : rawDestination;

    const geocoded = await geocodeDestination(
      destinationQuery,
      resolvedPincode || undefined,
      destinationIsPincode && !pincodeContext
    );
    if (!geocoded) {
      return NextResponse.json({ error: "Could not resolve destination" }, { status: 404 });
    }

    const city = normalizeText(geocoded.city || pincodeContext?.city || destinationQuery);
    const state = normalizeText(pincodeContext?.state || geocoded.state || "Unknown State");
    const country = normalizeText(pincodeContext?.country || geocoded.country || "India");

    const [wikiSummary, geoAttractions, geoShopping, osmAttractions, osmShopping, nominatimAttractions, nominatimShopping, foodSpots] =
      await Promise.all([
        fetchWikipediaSummary(city, state),
        fetchGeoapifyItems(geocoded.coords, "tourism.attraction,tourism.sights,tourism.museum,entertainment.theme_park", 10),
        fetchGeoapifyItems(geocoded.coords, "commercial.shopping_mall,commercial.marketplace,commercial.department_store,commercial.gift_and_souvenir", 10),
        fetchOverpassAttractions(geocoded.coords),
        fetchOverpassShopping(geocoded.coords),
        fetchNominatimFallbackItems({ city, state, country, coords: geocoded.coords }, "places", 10),
        fetchNominatimFallbackItems({ city, state, country, coords: geocoded.coords }, "shopping", 10),
        fetchFoodSpots(geocoded.coords),
      ]);

    const wikiImageMap = await fetchWikipediaImages([city, state]);

    // Strict mode: return fewer but high-confidence location-backed results only.
    let basePlaces = dedupeByName([...osmAttractions, ...geoAttractions, ...nominatimAttractions]).slice(0, 10);
    let baseShopping = dedupeByName([...osmShopping, ...geoShopping, ...nominatimShopping]).slice(0, 10);

    // Guarantee nearby fallback within 70km when either list is empty.
    if (basePlaces.length === 0 || baseShopping.length === 0) {
      let nearbyCenters = await fetchNearbyTownCenters(geocoded.coords, 70000);

      if (nearbyCenters.length === 0) {
        nearbyCenters = (await fetchNearbyNominatimCenters(city, state, country)).filter((center) => {
          const distance = haversineKm(geocoded.coords, center.coords);
          return Number.isFinite(distance) && distance <= 70;
        });
      }

      const nearbyCenterItems = nearbyCenters
        .map((center, index) => {
          const distanceKm = haversineKm(geocoded.coords, center.coords);
          return {
            id: `nearby-center-${index}-${slugifyName(center.name)}`,
            name: center.name,
            category: "nearby-city",
            lat: center.coords.lat,
            lng: center.coords.lng,
            distanceKm,
            address: "Nearby city center (<= 70km)",
            imageUrl: null,
            mapUrl: `https://www.google.com/maps/search/?api=1&query=${center.coords.lat},${center.coords.lng}`,
            source: "overpass" as const,
          };
        })
        .filter((item) => (item.distanceKm ?? 0) > 0.5)
        .slice(0, 8);

      if (basePlaces.length === 0) {
        basePlaces = nearbyCenterItems.map((item) => ({
          ...item,
          category: "nearby-place",
        }));
      }

      if (baseShopping.length === 0) {
        baseShopping = nearbyCenterItems.map((item) => ({
          ...item,
          category: "nearby-shopping",
        }));
      }
    }

    const places = basePlaces.map((item) => ({
      ...item,
      imageUrl: item.imageUrl || wikiImageMap[item.name.toLowerCase()] || null,
    }));

    const shopping = baseShopping.map((item) => ({
      ...item,
      imageUrl: item.imageUrl || wikiImageMap[item.name.toLowerCase()] || null,
    }));

    const famousFoods = buildFoodGuideItems(state);

    const famousPlaceNames = places.map((item) => item.name).slice(0, 8);
    const shoppingNames = shopping.map((item) => item.name).slice(0, 8);

    const payload: DestinationGuideResponse = {
      destination: {
        city,
        state,
        country,
        lat: geocoded.coords.lat,
        lng: geocoded.coords.lng,
      },
      overview: wikiSummary.extract,
      heroImageUrl: wikiSummary.imageUrl || wikiImageMap[city.toLowerCase()] || null,
      places,
      shopping,
      famousFoods,
      tips: buildTips(city, places.length, foodSpots.length),
      famousPlaces: famousPlaceNames,
      shoppingHighlights: shoppingNames,
      popularFoodSpots: foodSpots,
      threeDayPlan: chunkPlaces(famousPlaceNames, Number.isFinite(days) ? days : 3),
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Destination guide error:", error);
    return NextResponse.json({ error: "Failed to generate destination guide" }, { status: 500 });
  }
}
