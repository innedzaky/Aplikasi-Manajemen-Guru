export type UserRole = 'OWNER' | 'ADMIN' | 'GURU';

export * from './sync';

export interface ScheduledEvent {
  cron: string;
  type: string;
  scheduledTime: number;
}

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  CORS_ORIGIN?: string;
  SESSION_SECRET?: string;
  SYNC_SECRET?: string;
  GAS_SYNC_URL?: string;
  GAS_SYNC_ENDPOINT?: string;
  GAS_SYNC_SECRET?: string;
  APP_URL?: string;
}

export interface UserSessionPayload {
  userId: string;
  schoolId: string;
  role: UserRole;
  teacherId?: string | null;
  username: string;
  name: string;
  sessionId: string;
}

export interface AuthenticatedUser {
  id: string;
  schoolId: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  teacherId?: string | null;
  name: string;
  nip?: string | null;
  specialization?: string | null;
  lastLoginAt?: string | null;
}

export interface SessionInfo {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    total?: number;
    page?: number;
    limit?: number;
  };
}
