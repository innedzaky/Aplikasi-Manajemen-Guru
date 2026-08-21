import { ApiResponse } from '../types';
import { DEFAULT_SECURITY_HEADERS } from '../middleware/security';

export function jsonResponse<T>(
  data: T,
  status = 200,
  headers: Record<string, string> = {},
  meta?: Partial<ApiResponse['meta']>
): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-School-ID, Accept, Origin',
      ...DEFAULT_SECURITY_HEADERS,
      ...headers
    }
  });
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: any,
  headers: Record<string, string> = {}
): Response {
  const body: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-School-ID, Accept, Origin',
      ...DEFAULT_SECURITY_HEADERS,
      ...headers
    }
  });
}

export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateToken(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
