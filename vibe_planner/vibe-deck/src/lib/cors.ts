import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS configuration for development and production
 */
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // Development: Allow same-origin only
    return {
      'Access-Control-Allow-Origin': origin || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };
  }

  // Production: TODO - Configure proper CORS for production
  // This should be updated based on your production domain
  return {
    'Access-Control-Allow-Origin':
      process.env.ALLOWED_ORIGIN || 'https://vibedeck.app',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handles CORS preflight requests
 */
export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    const headers = getCorsHeaders(origin);

    return new NextResponse(null, {
      status: 200,
      headers,
    });
  }

  return null;
}

/**
 * Adds CORS headers to a response
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
