/**
 * Foundation Authentication Contracts & Types
 *
 * NOTE: Foundation only. Business authentication flows and implementations
 * will be established during Phase 2 (Identity + Auth + RBAC).
 */

export interface AuthUser {
  id: string;
  email: string;
  isActive: boolean;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  expiresAt: Date;
}

export interface AuthContext {
  user: AuthUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
}

export interface IAuthService {
  validateSession(sessionId: string): Promise<AuthContext>;
}
