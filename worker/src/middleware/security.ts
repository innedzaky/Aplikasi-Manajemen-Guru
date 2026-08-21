import { Env } from '../types';

export const DEFAULT_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export function getSecurityHeaders(env?: Env, request?: Request): Record<string, string> {
  const reqOrigin = request?.headers.get('Origin') || '*';
  const allowedOrigin = (env?.CORS_ORIGIN && env.CORS_ORIGIN !== '*') ? reqOrigin : '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-School-ID, Accept, Origin',
    'Access-Control-Max-Age': '86400',
    ...DEFAULT_SECURITY_HEADERS
  };
}

export function handleCorsPreflight(request: Request, env?: Env): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getSecurityHeaders(env, request)
    });
  }
  return null;
}
