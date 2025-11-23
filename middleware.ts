import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define your public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/rules(.*)',
  '/leaderboard(.*)',
])

// Define auth routes that should be accessible without authentication
const isAuthRoute = createRouteMatcher([
  '/auth/login(.*)',
  '/auth/register(.*)',
  '/auth/reset-password(.*)',
])

// Define API routes that need authentication
const isApiRoute = createRouteMatcher([
  '/api(.*)',
])

const isProfileSetupRoute = createRouteMatcher(['/profile-setup'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Allow public routes to be accessed
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Allow auth routes to be accessed without authentication
  if (isAuthRoute(req)) {
    return NextResponse.next()
  }

  // For API routes, require authentication but don't redirect
  if (isApiRoute(req)) {
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  // If user is not logged in and not on a public or auth route, redirect to login
  if (!userId && !isPublicRoute(req) && !isAuthRoute(req)) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // If user is logged in, check if they need to complete profile
  // We handle this check in the layout component instead of middleware
  // to avoid Edge Runtime limitations with Firebase Admin SDK
  if (userId && !isProfileSetupRoute(req)) {
    // For now, let the request proceed and handle profile checks in the app
    // The profile completion check will be done client-side in the layout
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}