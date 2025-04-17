import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/verify-request',
    '/auth/error',
    '/api/auth',
    '/pricing',
    '/api/test-db', // Next-auth API routes should remain accessible
  ];

  // Extract the pathname from the request URL
  const { pathname } = request.nextUrl;

  // Check if the current path is a public route or starts with one of the public routes
  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`) ||
      pathname.startsWith('/api/auth/')
  );

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // If user is not logged in, redirect to sign-in page
  if (!token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // For API routes, return unauthorized status instead of redirect
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // User is authenticated, allow access to protected routes
  return NextResponse.next();
}

// Configure matcher to specify which routes should trigger this middleware
export const config = {
  matcher: [
    // Apply to all routes except static files and api health check
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
