export interface AuthUser { id: string; employeeId: string; fullName: string; email: string; isActive: boolean; }
export interface AuthSession { sessionId: string; userId: string; expiresAt: Date; }
export interface AuthContext { user: AuthUser | null; session: AuthSession | null; isAuthenticated: boolean; }
export interface IAuthService { validateSession(sessionId: string): Promise<AuthContext>; }
export type DataScope = 'SELF' | 'TEAM' | 'COMPANY';
