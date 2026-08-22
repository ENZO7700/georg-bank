import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for security headers and CORS
 * 
 * This middleware adds security headers to all responses:
 * - Permissions-Policy: Controls which browser features can be used
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - Content-Security-Policy: Restricts resource loading
 */
export function middleware(request: NextRequest): NextResponse {
  // Clone the request to modify headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Content Security Policy
  // Allow camera access from self, scripts from self and unsafe-eval (for Next.js dev)
  // Allow images from self, data, and blob (for QR scanning)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "connect-src 'self'; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );

  // CORS headers (for API routes)
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID, Idempotency-Key');

  return response;
}

/**
 * Config to apply middleware to all routes
 */
export const config = {
  matcher: '/:path*',
};
