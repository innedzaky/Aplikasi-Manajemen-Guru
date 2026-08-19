import { Env } from '../types';

export const DEFAULT_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

export function getSecurityHeaders(env: Env): Record<string, string> {
  const allowedOrigin = env.CORS_ORIGIN || (env.ENVIRONMENT === 'production' ? 'https://your-school-domain.com' : '*');

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-School-ID',
    'Access-Control-Allow-Credentials': 'true',
    ...DEFAULT_SECURITY_HEADERS
  };
}

export function handleCorsPreflight(request: Request, env: Env): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getSecurityHeaders(env)
    });
  }
  return null;
}
