import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

// Geocoding helper function with better address handling
async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Try multiple search strategies for better results
    const searchQueries = [
      query, // Original query
      `${query}, India`, // Add India for better context
      query.replace(/,/g, ' '), // Remove commas
    ];

    for (const searchQuery of searchQueries) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TripYojana/1.0',
          },
        }
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        console.log(`Geocoded "${searchQuery}" successfully:`, {
          lat: data[0].lat,
          lon: data[0].lon,
          display_name: data[0].display_name
        });
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      
      // Add a small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`Failed to geocode: "${query}"`);
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

    return NextResponse.json({ places }, { status: 200 });
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

    if (!tripId || !name || !category) {
      return NextResponse.json(
        { error: "Missing required fields (tripId, name, category)" },
        { status: 400 }
      );
    }

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
        
        // If address wasn't provided, save the geocoding query as address
        if (!address) {
          address = geocodeQuery;
        }
      } else {
        console.error(`Geocoding failed for: "${geocodeQuery}"`);
        return NextResponse.json(
          { error: `Could not find coordinates for "${geocodeQuery}". Please try adding more details like city name or provide a more specific address.` },
          { status: 400 }
        );
      }
    }

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
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
        lat,
        lng,
        category,
        address: address || null,
        time: time || null,
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
