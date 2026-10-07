import type { AppDatabase } from '@/lib/db';
import { AuthError, getPrincipal, type AuthenticatedPrincipal } from './service';
import type { AuthContext } from './index';

/**
 * API middleware helper - eliminates duplicate auth boilerplate
 *
 * Usage in API routes:
 * ```typescript
 * const { db, principal } = await withAuth(env.poc_operation_db, context.locals.auth);
 * ```
 */
export async function withAuth(
  database: D1Database,
  auth: AuthContext
): Promise<{ db: AppDatabase; principal: AuthenticatedPrincipal }> {
  const { createDb } = await import('@/lib/db');
  const db = createDb(database);
  const principal = await getPrincipal(db, auth);
  return { db, principal };
}

/**
 * Role-based authorization helper
 *
 * Usage:
 * ```typescript
 * requireRole(principal, 'ADMIN', 'CEO');
 * ```
 */
export function requireRole(principal: AuthenticatedPrincipal, ...allowedRoles: string[]): void {
  const userRoles = principal.roles.map(r => r.toUpperCase());
  const hasRole = allowedRoles.some(role => userRoles.includes(role.toUpperCase()));

  if (!hasRole) {
    throw new AuthError(
      403,
      `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      'INSUFFICIENT_ROLE'
    );
  }
}

/**
 * Check if principal has any of the given roles
 */
export function hasAnyRole(principal: AuthenticatedPrincipal, ...roles: string[]): boolean {
  const userRoles = principal.roles.map(r => r.toUpperCase());
  return roles.some(role => userRoles.includes(role.toUpperCase()));
}

/**
 * Check if principal has a specific role
 */
export function hasRole(principal: AuthenticatedPrincipal, role: string): boolean {
  return principal.roles.some(r => r.toUpperCase() === role.toUpperCase());
}
