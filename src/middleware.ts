import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Redirect to login if accessing protected routes without auth
    if (!token && (path.startsWith('/dashboard') || path.startsWith('/upload') || path.startsWith('/settings'))) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Admin-only routes
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Moderator+ routes (if any)
    if (path.startsWith('/moderation') && !['ADMIN', 'MODERATOR'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes without auth
        const publicPaths = ['/', '/login', '/signup', '/explore', '/about', '/terms', '/privacy']
        const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))
        
        if (isPublicPath) return true
        
        // Require auth for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

