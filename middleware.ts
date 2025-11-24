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
  // Note: We generally avoid redirecting API routes to sign-in pages (returns HTML to a JSON client),
  // but since your isProtectedRoute list mostly targets pages, this logic is fine.
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images in public folder
     * * FIXED: Removed 'api|' from the exclusion list below so middleware runs on API routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}