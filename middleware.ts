import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/rules(.*)',
  '/leaderboard(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)', // Clerk webhooks should be public
])

// Define routes that should be protected
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/judge(.*)',
  '/participant(.*)',
  '/profile-setup(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth()

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
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