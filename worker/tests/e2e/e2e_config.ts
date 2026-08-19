/**
 * FASE U8: E2E Test Suite Configuration
 * Defines global test parameters, tenant identifiers, and secret keys.
 */

export const E2E_CONFIG = {
  SCHOOL_A: {
    id: 'sch_nusantara_01',
    name: 'SMA Nusantara 1',
    npsn: '10293847'
  },
  SCHOOL_B: {
    id: 'sch_merdeka_02',
    name: 'SMA Merdeka 2',
    npsn: '99887766'
  },
  SECRETS: {
    SESSION: 'dev-jwt-secret-key-32-bytes-long!',
    SYNC: 'dev-sync-secret-test-32-bytes-long!'
  },
  MAX_RETRY_ATTEMPTS: 5,
  STALE_TIMEOUT_MINUTES: 5,
  REPLAY_WINDOW_SECONDS: 300
};
