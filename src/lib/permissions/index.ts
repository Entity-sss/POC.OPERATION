/**
 * Foundation Permission & RBAC Contracts & Types
 *
 * NOTE: Foundation contracts only. Specific business roles, permissions,
 * policies, and evaluation logic will be established during Phase 2.
 */

export type ActionVerb = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface PermissionContract {
  resource: string;
  action: ActionVerb;
}

export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
}

export interface IPermissionEvaluator {
  can(userId: string, permission: PermissionContract): Promise<PermissionCheckResult>;
}
