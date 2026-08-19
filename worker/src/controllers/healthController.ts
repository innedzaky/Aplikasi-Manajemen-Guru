import { Env } from '../types';
import { jsonResponse } from '../utils/response';

export type ConfigState = 'CONFIGURED' | 'MISSING' | 'INVALID';

export interface EnvironmentValidation {
  d1Binding: ConfigState;
  sessionSecret: ConfigState;
  syncSecret: ConfigState;
  gasSyncUrl: ConfigState;
}

/**
 * Validates environment configuration states without exposing any secret values.
 */
export function validateEnvironmentConfig(env: Env): EnvironmentValidation {
  // 1. D1 Binding check
  const d1Binding: ConfigState = env.DB ? 'CONFIGURED' : 'MISSING';

  // 2. SESSION_SECRET check (requires at least 16 characters for cryptographic safety)
  let sessionSecret: ConfigState = 'MISSING';
  if (env.SESSION_SECRET) {
    sessionSecret = env.SESSION_SECRET.trim().length >= 16 ? 'CONFIGURED' : 'INVALID';
  }

  // 3. SYNC_SECRET check (requires at least 16 characters for HMAC-SHA256 safety)
  const syncSec = env.SYNC_SECRET || env.GAS_SYNC_SECRET;
  let syncSecret: ConfigState = 'MISSING';
  if (syncSec) {
    syncSecret = syncSec.trim().length >= 16 ? 'CONFIGURED' : 'INVALID';
  }

  // 4. GAS_SYNC_URL check (must be a valid URL string or endpoint)
  const gasUrl = env.GAS_SYNC_URL || env.GAS_SYNC_ENDPOINT;
  let gasSyncUrl: ConfigState = 'MISSING';
  if (gasUrl) {
    try {
      const parsed = new URL(gasUrl);
      gasSyncUrl = (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? 'CONFIGURED' : 'INVALID';
    } catch {
      gasSyncUrl = 'INVALID';
    }
  }

  return {
    d1Binding,
    sessionSecret,
    syncSecret,
    gasSyncUrl
  };
}

export class HealthController {
  static async check(env: Env): Promise<Response> {
    const start = Date.now();
    let isDbConnected = false;
    let tableCount = 0;

    // Validate D1 connectivity safely without exposing stack traces or schema internals
    try {
      const result = await env.DB.prepare(`
        SELECT count(*) as total FROM sqlite_schema 
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';
      `).first<{ total: number }>();
      
      isDbConnected = true;
      tableCount = result?.total ?? 0;
    } catch {
      isDbConnected = false;
    }

    const latencyMs = Date.now() - start;
    const configStates = validateEnvironmentConfig(env);

    const isHealthy = isDbConnected && configStates.d1Binding === 'CONFIGURED';

    const payload = {
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'Sistem Manajemen Guru API (Cloudflare Worker)',
      database: isDbConnected ? 'connected' : 'disconnected',
      environment: env.ENVIRONMENT || 'development',
      config: configStates,
      meta: {
        latencyMs,
        tablesCount: tableCount
      },
      timestamp: new Date().toISOString()
    };

    return jsonResponse(payload, isHealthy ? 200 : 503);
  }
}
