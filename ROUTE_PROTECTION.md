# Route Protection Implementation Guide

This document explains the complete route protection implementation for the Trip Yojana Next.js application using NextAuth.

## Overview

The application uses a **dual-layer protection strategy**:
1. **Server-side protection** via Next.js middleware
2. **Client-side protection** via useSession hooks and components

This ensures both security and a smooth user experience without content flicker.

---

## 1. Server-Side Protection (Middleware)

**Location:** [`middleware.ts`](middleware.ts)

The middleware runs on every request and handles:
- Redirecting unauthenticated users from protected pages to `/auth`
- Redirecting authenticated users away from `/auth` to `/dashboard`
- Preserving callback URLs for post-login redirects
- Allowing public access to home page and auth pages

### Protected Routes
The following routes require authentication:
- `/dashboard` - Main dashboard
- `/create-trip` - Trip creation
- `/budget` - Budget management
- `/expenses` - Expense tracking
- `/itinerary` - Itinerary planning
- `/map` - Map view
- `/notifications` - Notifications
- `/ux-demo` - UX demonstration

### Public Routes
- `/` - Home page (landing)
- `/auth` - Authentication page
- `/api/auth/*` - NextAuth API routes
- `/api/register` - Registration endpoint

### How It Works
```typescript
// middleware.ts checks JWT token from NextAuth
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
const isLoggedIn = Boolean(token);

// Redirect logic
if (!isLoggedIn && isProtectedRoute) {
  // Redirect to /auth with callback URL
  return NextResponse.redirect(new URL("/auth", req.url));
}
```

---

## 2. Client-Side Protection

We provide two approaches for client-side protection:

### Approach A: Using the `useAuth` Hook

**Location:** [`packages/hooks/useAuth.ts`](packages/hooks/useAuth.ts)

**Best for:** Pages that need access to user data or want fine-grained control

**Example:** Dashboard page

```tsx
import { useAuth } from "@/packages/hooks/useAuth";
import AuthLoading from "@/packages/components/auth/AuthLoading";

export default function DashboardPage() {
  const { status, user } = useAuth();

  // Show loading state while checking authentication
  if (status === "loading") {
    return <AuthLoading message="Verifying your session..." />;
  }

  // Don't render if not authenticated (useAuth will redirect)
  if (status !== "authenticated") {
    return null;
  }

  // Render protected content
  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      {/* Your protected content */}
    </div>
  );
}
```

### Approach B: Using the `ProtectedRoute` Component

**Location:** [`packages/components/auth/ProtectedRoute.tsx`](packages/components/auth/ProtectedRoute.tsx)

**Best for:** Simple pages that don't need direct access to session data

**Example:** Create Trip page

```tsx
import ProtectedRoute from "@/packages/components/auth/ProtectedRoute";

export default function CreateTripPage() {
  return (
    <ProtectedRoute>
      {/* Your protected content */}
      <div>
        <h1>Create New Trip</h1>
        {/* ... */}
      </div>
    </ProtectedRoute>
  );
}
```

---

## 3. Key Components

### AuthLoading Component

**Location:** [`packages/components/auth/AuthLoading.tsx`](packages/components/auth/AuthLoading.tsx)

A reusable loading component that prevents content flicker during auth checks.

**Features:**
- Centered loading spinner
- Customizable message
- Full-screen or inline mode

**Usage:**
```tsx
<AuthLoading message="Loading your dashboard..." />
<AuthLoading fullScreen={false} /> // Inline mode
```

### SessionProvider

**Location:** [`packages/components/auth/SessionProvider.tsx`](packages/components/auth/SessionProvider.tsx)

Wraps the NextAuth SessionProvider for client-side session access. Already configured in the root layout.

---

## 4. Authentication Flow

### For Unauthenticated Users:

1. User tries to access `/dashboard`
2. **Middleware checks JWT token** → No token found
3. **Middleware redirects** to `/auth?callbackUrl=/dashboard`
4. User logs in successfully
5. NextAuth redirects to callback URL (`/dashboard`)
6. **Middleware allows access**
7. **Client component checks session** → Authenticated
8. Dashboard content renders

### For Authenticated Users:

1. User navigates to `/dashboard`
2. **Middleware checks JWT token** → Token valid
3. **Middleware allows request**
4. **Client component checks session** → Shows loading state
5. **Session confirmed** → Content renders

---

## 5. Preventing Content Flicker

The implementation prevents flicker by:

1. **Server-side redirect** happens before page loads (middleware)
2. **Loading state** shown during client-side session check
3. **Content only renders** when authentication is confirmed
4. **No rendered content** for unauthenticated users

### Bad Example (Causes Flicker):
```tsx
// ❌ This will show protected content briefly before redirect
export default function BadPage() {
  const { data: session } = useSession();
  
  return (
    <div>
      {/* This renders immediately, causing flicker */}
      <h1>Protected Content</h1>
    </div>
  );
}
```

### Good Example (No Flicker):
```tsx
// ✅ This shows loading state, then redirects or renders
export default function GoodPage() {
  const { status } = useAuth();
  
  if (status === "loading") {
    return <AuthLoading />;
  }
  
  if (status !== "authenticated") {
    return null;
  }
  
  return <div>Protected Content</div>;
}
```

---

## 6. Protecting Additional Pages

To protect a new page, use either approach:

### Option 1: Add to middleware's protected routes list
```typescript
// middleware.ts
const protectedRoutes = [
  "/dashboard",
  "/create-trip",
  "/your-new-page", // Add here
];
```

### Option 2: Use ProtectedRoute wrapper
```tsx
// your-new-page.tsx
import ProtectedRoute from "@/packages/components/auth/ProtectedRoute";

export default function YourNewPage() {
  return (
    <ProtectedRoute>
      {/* Your content */}
    </ProtectedRoute>
  );
}
```

### Option 3: Use useAuth hook
```tsx
// your-new-page.tsx
import { useAuth } from "@/packages/hooks/useAuth";
import AuthLoading from "@/packages/components/auth/AuthLoading";

export default function YourNewPage() {
  const { status, user } = useAuth();
  
  if (status === "loading") return <AuthLoading />;
  if (status !== "authenticated") return null;
  
  return <div>Content for {user?.name}</div>;
}
```

---

## 7. Testing Checklist

- [ ] Unauthenticated users cannot access protected pages
- [ ] Unauthenticated users are redirected to `/auth`
- [ ] Authenticated users can access all protected pages
- [ ] Authenticated users redirected from `/auth` to `/dashboard`
- [ ] No content flicker during authentication checks
- [ ] Loading states appear during session verification
- [ ] Callback URLs work correctly after login
- [ ] Public pages (home) accessible to everyone
- [ ] User name displays correctly in protected pages

---

## 8. Troubleshooting

### Issue: Users can see protected content briefly before redirect
**Solution:** Ensure you're showing a loading state and returning `null` for unauthenticated status:
```tsx
if (status === "loading") return <AuthLoading />;
if (status !== "authenticated") return null;
```

### Issue: Infinite redirect loop
**Solution:** Check that `/auth` is in the public routes list in middleware

### Issue: Session not available in component
**Solution:** Ensure `SessionProvider` is wrapping your app in the root layout

### Issue: Middleware not running
**Solution:** Check the `config.matcher` in middleware.ts includes your route

---

## 9. Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

---

## Summary

✅ **Server-side protection** via middleware prevents unauthorized access
✅ **Client-side protection** via useSession ensures proper UI state
✅ **Loading states** prevent content flicker
✅ **Dual approaches** (hook vs component) for flexibility
✅ **Clean UX** with proper redirects and loading indicators

This implementation provides robust, production-ready authentication with excellent user experience.
