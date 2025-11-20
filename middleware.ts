import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server'
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
  if (userId && !isProfileSetupRoute(req)) {
    try {
      // Fetch user data directly from Clerk to get the latest metadata
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)

      // Check if user has completed profile setup (has role in metadata)
      const publicMetadata = user.publicMetadata as { role?: string } | undefined
      const hasCompletedProfile = Boolean(publicMetadata?.role)

      // If profile not completed and not on profile-setup page, redirect there
      if (!hasCompletedProfile && !req.nextUrl.pathname.startsWith('/profile-setup')) {
        return NextResponse.redirect(new URL('/profile-setup', req.url))
      }
    } catch (error) {
      console.error('Error checking user profile in middleware:', error)
      // On error, allow the request to proceed to avoid blocking the user
    }
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