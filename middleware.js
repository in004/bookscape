// /middleware.ts (or /middleware.js in JS)
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt'; // Get JWT token from NextAuth
import { NextRequest } from 'next/server';


export async function middleware(req) {
  // Get the token from NextAuth
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/']; // Define public paths

  // If the request is for a public path, allow it to pass
  if (publicPaths.includes(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // If the user is authenticated
  if (token) {
    // If the user has a role, you can handle it based on the route
    if (req.nextUrl.pathname.startsWith('/dashboard/admin') && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url)); // Redirect to an "unauthorized" page
    }
    
    if (req.nextUrl.pathname.startsWith('/dashboard/client') && token.role !== 'client') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (req.nextUrl.pathname.startsWith('/dashboard/courier') && token.role !== 'courier') {
      return NextResponse.redirect(new URL('/unauthorized', req.url)); 
    }

    return NextResponse.next(); // Allow authenticated users to proceed to their respective page
  }

  // If the user is not authenticated, redirect them to login
  return NextResponse.redirect(new URL('/login', req.url));
}

// Define matcher for paths that should run this middleware
export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/orders/:path*'],
};