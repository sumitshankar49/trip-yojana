import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

function parseCoordinate(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const normalizedValue =
    typeof value === "string"
      ? value.trim().replace(",", ".")
      : value;
  const parsed = typeof normalizedValue === "number" ? normalizedValue : Number(normalizedValue);

  return Number.isFinite(parsed) ? parsed : null;
}

function isCoordinateInRange(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Enhanced geocoding helper with multiple strategies
async function geocodeAddress(query: string): Promise<{ lat: number; lng: number; resolvedAddress?: string } | null> {
  try {
    const tokenize = (value: string): string[] => {
      const stopWords = new Set([
        "near",
        "close",
        "beside",
        "adjacent",
        "to",
        "the",
        "and",
        "city",
        "state",
        "road",
      ]);

      return value
        .toLowerCase()
        .replace(/[^a-z0-9\s,]/g, " ")
        .split(/[\s,]+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 2 && !stopWords.has(token));
    };

    // Helper to extract location components
    const extractLocationParts = (address: string) => {
      const parts = address.split(',').map(p => p.trim());
      const city = parts.find(p => /patna|delhi|mumbai|kolkata|bangalore|chennai|hyderabad/i.test(p));
      const state = parts.find(p => /bihar|delhi|maharashtra|west bengal|karnataka|tamil nadu|telangana/i.test(p));
      const landmark = parts.find(p => p.length > 3 && !p.match(/\d{6}/) && p !== city && p !== state);
      
      return { city, state, landmark, parts };
    };

    const { city, state, landmark, parts } = extractLocationParts(query);
  const originalTokens = tokenize(query);

    // Generate multiple search strategies - from specific to general
    const searchQueries = [
      query, // Original query
      query.replace(/near|close to|beside|adjacent to/gi, '').trim(), // Remove proximity words
      query.replace(/,/g, ' ').trim(), // Remove commas
      landmark && city ? `${landmark}, ${city}` : null, // Landmark + City
      landmark && state ? `${landmark}, ${state}` : null, // Landmark + State
      city && state ? `${city}, ${state}` : null, // City + State
      city ? city : null, // Just city
      parts.length > 1 ? parts[parts.length - 2] : null, // Second to last part (often city)
      parts[0]?.replace(/near|close to/gi, '').trim(), // First part without proximity words
    ].filter(Boolean) as string[];

    // Also try splitting long addresses
    if (parts.length > 3) {
      searchQueries.push(parts.slice(-3).join(', ')); // Last 3 parts
      searchQueries.push(parts.slice(-2).join(', ')); // Last 2 parts
    }

    console.log(`Geocoding strategies for "${query}":`, searchQueries.slice(0, 5));

    for (const searchQuery of searchQueries) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'TripYojana/1.0 (contact@tripyojana.com)',
            },
          }
        );
        
        if (!response.ok) {
          console.warn(`Nominatim returned ${response.status} for "${searchQuery}"`);
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
          const topResult = data[0];
          const displayName = String(topResult.display_name || "");
          const searchTokens = tokenize(searchQuery);
          const resultTokens = tokenize(displayName);
          const overlapCount = originalTokens.filter((token) => resultTokens.includes(token)).length;
          const isBroadFallback = searchTokens.length <= 2 && originalTokens.length >= 3;

          if (isBroadFallback && overlapCount < 2) {
            console.log(`Skipping low-confidence geocode result for "${searchQuery}":`, {
              displayName,
              overlapCount,
              originalTokenCount: originalTokens.length,
            });

            await new Promise(resolve => setTimeout(resolve, 300));
            continue;
          }

          const parsedLat = parseFloat(topResult.lat);
          const parsedLng = parseFloat(topResult.lon);
          if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
            continue;
          }

          console.log(`✓ Geocoded "${searchQuery}" successfully:`, {
            lat: topResult.lat,
            lon: topResult.lon,
            display_name: topResult.display_name
          });
          return {
            lat: parsedLat,
            lng: parsedLng,
            resolvedAddress: displayName || undefined,
          };
        }
      } catch (err) {
        console.error(`Error trying "${searchQuery}":`, err);
      }
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`✗ All geocoding strategies failed for: "${query}"`);
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tripIdParam = searchParams.get("tripId");
    const tripId = tripIdParam ? tripIdParam : null;

    if (!tripId || !tripId.trim()) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: session.user.id,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Get all places for this trip
    const places = await prisma.tripPlace.findMany({
      where: { tripId },
      orderBy: { order: "asc" },
    });

    const sanitizedPlaces = places.filter((place) => {
      const lat = parseCoordinate(place.lat);
      const lng = parseCoordinate(place.lng);
      return lat !== null && lng !== null && isCoordinateInRange(lat, lng);
    });

    return NextResponse.json({ places: sanitizedPlaces }, { status: 200 });
  } catch (error) {
    console.error("Places GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tripId, name, description, category, time } = body;
    let { lat, lng, address } = body;

    const normalizedAddress = typeof address === "string" ? address.trim() : "";
    const normalizedTime = typeof time === "string" ? time.trim() : "";

    if (!tripId || !name || !category) {
      return NextResponse.json(
        { error: "Missing required fields (tripId, name, category)" },
        { status: 400 }
      );
    }

    if (!normalizedAddress || !normalizedTime) {
      return NextResponse.json(
        { error: "Address and visit time are required" },
        { status: 400 }
      );
    }

    address = normalizedAddress;

    // If coordinates are missing, try to geocode from address or name
    if ((lat === undefined || lng === undefined || lat === null || lng === null || lat === "" || lng === "") && (address || name)) {
      // Build a better geocoding query
      let geocodeQuery = address || name;
      
      // If address is provided, use it; otherwise combine name with trip location if available
      if (!address && name) {
        // Try to get trip source/destination for better context
        const tripForContext = await prisma.trip.findUnique({
          where: { id: tripId },
          select: { source: true, destination: true },
        });
        
        if (tripForContext?.source) {
          geocodeQuery = `${name}, ${tripForContext.source}`;
        }
      }
      
      console.log(`Attempting to geocode: "${geocodeQuery}"`);
      const coords = await geocodeAddress(geocodeQuery);
      
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        console.log(`Successfully geocoded to: lat=${lat}, lng=${lng}`);

        address = coords.resolvedAddress || address || geocodeQuery;
      } else {
        console.error(`Geocoding failed for: "${geocodeQuery}"`);
        
        // Provide helpful suggestions based on the query
        const suggestions: string[] = [];
        const parts = geocodeQuery.split(',').map((p: string) => p.trim());
        
        if (parts.length > 2) {
          suggestions.push(`Try just the city name: "${parts[parts.length - 2]}"`);
        }
        if (geocodeQuery.includes('near') || geocodeQuery.includes('Near')) {
          const simplified = geocodeQuery.replace(/near|Near|close to/gi, '').trim();
          suggestions.push(`Try without 'near': "${simplified}"`);
        }
        suggestions.push("Try adding just the city and state");
        suggestions.push("Or click 'Find on Map' in the form to select manually");
        
        return NextResponse.json(
          { 
            error: `Could not find coordinates for "${geocodeQuery}".`,
            suggestions: suggestions,
            tip: "Try simplifying the address to just the landmark name and city, or use manual coordinates."
          },
          { status: 400 }
        );
      }
    }

    const parsedLat = parseCoordinate(lat);
    const parsedLng = parseCoordinate(lng);

    if (parsedLat === null || parsedLng === null) {
      return NextResponse.json(
        { error: "Latitude and longitude are required and must be valid numbers" },
        { status: 400 }
      );
    }

    if (!isCoordinateInRange(parsedLat, parsedLng)) {
      return NextResponse.json(
        { error: "Latitude/longitude are out of valid range" },
        { status: 400 }
      );
    }

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: session.user.id,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Get the next order number
    const maxOrder = await prisma.tripPlace.findFirst({
      where: { tripId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = (maxOrder?.order ?? -1) + 1;

    // Create the place
    const place = await prisma.tripPlace.create({
      data: {
        tripId,
        name,
        description: description || null,
        lat: parsedLat,
        lng: parsedLng,
        category,
        address,
        time: normalizedTime,
        order: nextOrder,
      },
    });

    return NextResponse.json({ place }, { status: 201 });
  } catch (error) {
    console.error("Place creation error:", error);
    return NextResponse.json(
      { error: "Failed to create place" },
      { status: 500 }
    );
  }
}
