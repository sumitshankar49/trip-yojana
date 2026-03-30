import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = Boolean(token);
  const { pathname } = req.nextUrl;

  // Define protected routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/create-trip",
    "/budget",
    "/expenses",
    "/itinerary",
    "/map",
    "/notifications",
    "/profile",
    "/ux-demo"
  ];

  // Check if current path matches a protected route
  const isProtectedRoute = protectedRoutes.some((route) => 
    pathname === route || pathname.startsWith(route)
  );

  // Always allow NextAuth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow public API routes (register)
  if (pathname === "/api/register" || pathname === "/api/auth/register") {
    return NextResponse.next();
  }

  // Redirect unauthenticated users trying to access protected routes
  if (!isLoggedIn && isProtectedRoute) {
    const signInUrl = new URL("/auth", req.url);
    signInUrl.searchParams.set("mode", "login");
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from auth page
  if (isLoggedIn && pathname === "/auth") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Allow all other requests
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
