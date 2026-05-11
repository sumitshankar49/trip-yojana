import { NextRequest, NextResponse } from "next/server";
import { fetchPincodeLocation } from "@/packages/lib/pincode";

export const runtime = "nodejs";

async function getPincode(params: Promise<{ pincode: string }>): Promise<string> {
  const { pincode } = await params;
  return pincode?.trim() || "";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pincode: string }> }
) {
  try {
    const pincode = await getPincode(params);

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, message: "Invalid pincode" },
        { status: 400 }
      );
    }

    const location = await fetchPincodeLocation(pincode);

    if (!location) {
      return NextResponse.json(
        { success: false, message: "Could not resolve pincode" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, location }, { status: 200 });
  } catch (error) {
    console.error("Pincode lookup error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
