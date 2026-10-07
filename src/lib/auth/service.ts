import { and, desc, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm';
import type { AppDatabase } from '@/lib/db';
import {
  auditLogs,
  authRateLimits,
  departments,
  designations,
  employeePermissionOverrides,
  employeeRegistrationRequests,
  employeeRoles,
  employees,
  permissions,
  rolePermissions,
  roles,
  sessions,
  users,
} from '@/lib/db/schema';
import { writeAuditLog } from '@/lib/audit';
import { generateOpaqueToken, hashOpaqueToken, hashPassword, verifyPassword } from './password';
import type { AuthContext, AuthUser, DataScope } from './index';
import type { z } from 'zod';
import type { registrationSchema, reviewRegistrationSchema, updateEmployeeSchema } from './validation';

const SESSION_TTL_MS = 8 * 60 * 60 * 1_000;
const RATE_WINDOW_MS = 15 * 60 * 1_000;
const MAX_LOGIN_ATTEMPTS = 5;

type RegistrationInput = z.infer<typeof registrationSchema>;
type ReviewInput = z.infer<typeof reviewRegistrationSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export type AuthenticatedPrincipal = AuthUser & {
  employeeUuid: string;
  departmentId?: string | null;
  departmentName?: string | null;
  designationId?: string | null;
  designationName?: string | null;
  managerEmployeeId?: string | null;
  roles: string[];
  dataScopes: DataScope[];
};

export class AuthError extends Error {
  constructor(public readonly status: number, message: string, public readonly code: string) { super(message); }
}

function emptyContext(): AuthContext { return { user: null, session: null, isAuthenticated: false }; }

export async function getAuthContext(db: AppDatabase, rawToken?: string): Promise<AuthContext> {
  if (!rawToken) return emptyContext();
  const tokenHash = await hashOpaqueToken(rawToken);
  const [record] = await db.select({ sessionId: sessions.id, sessionUserId: sessions.userId, expiresAt: sessions.expiresAt, userId: users.id, status: users.status, employeeId: employees.employeeId, fullName: employees.fullName, email: employees.email, employeeActive: employees.isActive })
    .from(sessions).innerJoin(users, eq(sessions.userId, users.id)).innerJoin(employees, eq(employees.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()))).limit(1);
  if (!record || record.status !== 'ACTIVE' || !record.employeeActive) return emptyContext();
  return { isAuthenticated: true, user: { id: record.userId, employeeId: record.employeeId, fullName: record.fullName, email: record.email, isActive: record.employeeActive }, session: { sessionId: record.sessionId, userId: record.sessionUserId, expiresAt: record.expiresAt } };
}

export async function getPrincipal(db: AppDatabase, context: AuthContext): Promise<AuthenticatedPrincipal> {
  if (!context.user) throw new AuthError(401, 'Authentication is required', 'UNAUTHENTICATED');
  const [empInfo] = await db.select({
    employeeUuid: employees.id,
    departmentId: employees.departmentId,
    departmentName: departments.name,
    designationId: employees.designationId,
    designationName: designations.name,
    managerEmployeeId: employees.managerEmployeeId,
  })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .where(eq(employees.userId, context.user.id))
    .limit(1);

  const assignments = await db.select({ code: roles.code, dataScope: roles.dataScope }).from(employeeRoles)
    .innerJoin(employees, eq(employeeRoles.employeeId, employees.id)).innerJoin(roles, eq(employeeRoles.roleId, roles.id))
    .where(and(eq(employees.userId, context.user.id), eq(roles.isActive, true)));
  return {
    ...context.user,
    employeeUuid: empInfo?.employeeUuid || '',
    departmentId: empInfo?.departmentId,
    departmentName: empInfo?.departmentName,
    designationId: empInfo?.designationId,
    designationName: empInfo?.designationName,
    managerEmployeeId: empInfo?.managerEmployeeId,
    roles: assignments.map((role) => role.code),
    dataScopes: assignments.map((role) => role.dataScope) as DataScope[],
  };
}

export async function getPermissions(db: AppDatabase, userId: string): Promise<Set<string>> {
  const roleRows = await db.select({ code: permissions.code }).from(employeeRoles)
    .innerJoin(employees, eq(employeeRoles.employeeId, employees.id)).innerJoin(rolePermissions, eq(employeeRoles.roleId, rolePermissions.roleId)).innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(employees.userId, userId));
  const overrides = await db.select({ code: permissions.code, effect: employeePermissionOverrides.effect }).from(employees)
    .innerJoin(employeePermissionOverrides, eq(employeePermissionOverrides.employeeId, employees.id))
    .innerJoin(permissions, eq(employeePermissionOverrides.permissionId, permissions.id)).where(eq(employees.userId, userId));
  const effective = new Set(roleRows.map((row) => row.code));
  for (const override of overrides) { if (override.effect === 'DENY') effective.delete(override.code); else effective.add(override.code); }
  return effective;
}

export async function requirePermission(db: AppDatabase, context: AuthContext, permission: string): Promise<AuthenticatedPrincipal> {
  const principal = await getPrincipal(db, context);
  const effective = await getPermissions(db, principal.id);
  if (!effective.has(permission) && !effective.has('*')) throw new AuthError(403, 'You are not authorized to perform this action', 'FORBIDDEN');
  return principal;
}

async function checkRateLimit(db: AppDatabase, key: string): Promise<void> {
  const [limit] = await db.select().from(authRateLimits).where(eq(authRateLimits.key, key)).limit(1);
  const now = Date.now();
  if (limit?.blockedUntil && limit.blockedUntil.getTime() > now) throw new AuthError(429, 'Too many login attempts. Try again later.', 'RATE_LIMITED');
  if (limit && limit.windowStartedAt.getTime() + RATE_WINDOW_MS <= now) await db.update(authRateLimits).set({ attempts: 0, windowStartedAt: new Date(now), blockedUntil: null, updatedAt: new Date(now) }).where(eq(authRateLimits.key, key));
}

async function recordFailedLogin(db: AppDatabase, key: string): Promise<void> {
  const now = Date.now();
  const [limit] = await db.select().from(authRateLimits).where(eq(authRateLimits.key, key)).limit(1);
  const isNewWindow = !limit || limit.windowStartedAt.getTime() + RATE_WINDOW_MS <= now;
  const attempts = isNewWindow ? 1 : limit.attempts + 1;
  const values = { attempts, windowStartedAt: new Date(now), blockedUntil: attempts >= MAX_LOGIN_ATTEMPTS ? new Date(now + RATE_WINDOW_MS) : null, updatedAt: new Date(now) };
  if (limit) await db.update(authRateLimits).set(values).where(eq(authRateLimits.key, key)); else await db.insert(authRateLimits).values({ key, ...values });
}

export async function login(db: AppDatabase, employeeId: string, password: string): Promise<{ token: string; expiresAt: Date; context: AuthContext }> {
  const rateKey = `employee:${employeeId}`;
  await checkRateLimit(db, rateKey);
  const [account] = await db.select({ userId: users.id, passwordHash: users.passwordHash, userStatus: users.status, employeeId: employees.employeeId, employeeActive: employees.isActive })
    .from(employees).innerJoin(users, eq(employees.userId, users.id)).where(eq(employees.employeeId, employeeId)).limit(1);
  if (!account || account.userStatus !== 'ACTIVE' || !account.employeeActive || !(await verifyPassword(password, account.passwordHash))) {
    await recordFailedLogin(db, rateKey);
    if (account) await writeAuditLog(db, { targetUserId: account.userId, action: 'AUTH_LOGIN_FAILED', entityType: 'user', entityId: account.userId, description: 'Failed login attempt' });
    throw new AuthError(401, 'Invalid employee ID or password', 'INVALID_CREDENTIALS');
  }
  await db.delete(authRateLimits).where(eq(authRateLimits.key, rateKey));
  const token = generateOpaqueToken(); const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const sessionId = crypto.randomUUID();
  await db.insert(sessions).values({ id: sessionId, userId: account.userId, tokenHash: await hashOpaqueToken(token), expiresAt });
  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, account.userId));
  await writeAuditLog(db, { performedByUserId: account.userId, targetUserId: account.userId, action: 'AUTH_LOGIN_SUCCEEDED', entityType: 'session', entityId: sessionId, description: 'User signed in' });
  return { token, expiresAt, context: (await getAuthContext(db, token)) };
}

export async function logout(db: AppDatabase, context: AuthContext): Promise<void> {
  if (!context.session || !context.user) return;
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, context.session.sessionId));
  await writeAuditLog(db, { performedByUserId: context.user.id, targetUserId: context.user.id, action: 'AUTH_LOGOUT', entityType: 'session', entityId: context.session.sessionId, description: 'User signed out' });
}

export async function createRegistrationRequest(db: AppDatabase, input: RegistrationInput): Promise<string> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedMobile = input.mobile.trim();

  const [existingEmail] = await db.select({ id: employees.id }).from(employees).where(eq(employees.email, normalizedEmail)).limit(1);
  if (existingEmail) throw new AuthError(409, 'An employee account already exists for this email', 'REGISTRATION_EXISTS');

  const [pendingEmail] = await db.select({ id: employeeRegistrationRequests.id }).from(employeeRegistrationRequests).where(and(eq(employeeRegistrationRequests.email, normalizedEmail), eq(employeeRegistrationRequests.status, 'PENDING'))).limit(1);
  if (pendingEmail) throw new AuthError(409, 'A pending registration request already exists for this email', 'REGISTRATION_EXISTS');

  const [existingMobile] = await db.select({ id: employees.id }).from(employees).where(eq(employees.mobile, normalizedMobile)).limit(1);
  if (existingMobile) throw new AuthError(409, 'An employee account already exists for this mobile number', 'REGISTRATION_EXISTS');

  const [pendingMobile] = await db.select({ id: employeeRegistrationRequests.id }).from(employeeRegistrationRequests).where(and(eq(employeeRegistrationRequests.mobile, normalizedMobile), eq(employeeRegistrationRequests.status, 'PENDING'))).limit(1);
  if (pendingMobile) throw new AuthError(409, 'A pending registration request already exists for this mobile number', 'REGISTRATION_EXISTS');

  const id = crypto.randomUUID();
  await db.insert(employeeRegistrationRequests).values({
    id,
    fullName: input.fullName.trim(),
    mobile: normalizedMobile,
    email: normalizedEmail,
    dateOfBirth: input.dateOfBirth ? input.dateOfBirth.trim() : null,
    currentAddress: input.currentAddress.trim(),
    permanentAddress: input.permanentAddress.trim(),
    education: input.education.trim(),
    priorExperience: input.priorExperience.trim(),
    passwordHash: await hashPassword(input.password),
  });
  await writeAuditLog(db, {
    action: 'REGISTRATION_SUBMITTED',
    entityType: 'employee_registration_request',
    entityId: id,
    description: `Employee registration request submitted for ${input.fullName.trim()} (${normalizedEmail})`,
  });
  return id;
}

async function allocateEmployeeId(db: AppDatabase): Promise<string> {
  const result = await db.all<{ next_value: number }>(sql`UPDATE employee_id_sequences SET next_value = next_value + 1, updated_at = unixepoch() * 1000 WHERE name = 'EMPLOYEE' RETURNING next_value - 1 AS next_value`);
  const value = result[0]?.next_value;
  if (!value) throw new Error('Employee ID sequence is unavailable');
  return `S${value}`;
}

export function secretMatches(expected: string, supplied: string): boolean {
  const expectedBytes = new TextEncoder().encode(expected);
  const suppliedBytes = new TextEncoder().encode(supplied);
  if (expectedBytes.length !== suppliedBytes.length) return false;
  let difference = 0;
  for (let index = 0; index < expectedBytes.length; index += 1) difference |= expectedBytes[index] ^ suppliedBytes[index];
  return difference === 0;
}

export type FirstAdminInput = {
  fullName: string;
  mobile: string;
  email: string;
  currentAddress: string;
  permanentAddress: string;
  education: string;
  priorExperience: string;
  password: string;
};

/** Operational-only entry point. It is deliberately not exposed through an Astro route. */
export async function provisionFirstAdmin(db: AppDatabase, suppliedToken: string | undefined, expectedToken: string | undefined, input: FirstAdminInput): Promise<{ employeeId: string }> {
  const trimmedExpected = expectedToken?.trim();
  const trimmedSupplied = suppliedToken?.trim();
  if (!trimmedExpected || !trimmedSupplied || !secretMatches(trimmedExpected, trimmedSupplied)) {
    throw new AuthError(403, 'First-admin provisioning is not authorized', 'PROVISIONING_UNAUTHORIZED');
  }
  const [adminRole] = await db.select({ id: roles.id }).from(roles).where(and(eq(roles.code, 'ADMIN'), eq(roles.isActive, true))).limit(1);
  if (!adminRole) throw new Error('The configured Admin role is unavailable');
  const existingAdmins = await db.select({ id: employees.id }).from(employeeRoles)
    .innerJoin(employees, eq(employeeRoles.employeeId, employees.id)).innerJoin(users, eq(employees.userId, users.id))
    .where(and(eq(employeeRoles.roleId, adminRole.id), eq(employees.isActive, true), eq(users.status, 'ACTIVE'))).limit(1);
  if (existingAdmins.length > 0) throw new AuthError(409, 'An active Admin already exists; first-admin provisioning cannot be reused', 'ADMIN_ALREADY_PROVISIONED');
  const [existingEmail] = await db.select({ id: employees.id }).from(employees).where(eq(employees.email, input.email)).limit(1);
  if (existingEmail) throw new AuthError(409, 'An employee already exists for this email', 'EMPLOYEE_EXISTS');
  const userId = crypto.randomUUID(); const employeeUuid = crypto.randomUUID(); const employeeId = await allocateEmployeeId(db);
  await db.batch([
    db.insert(users).values({ id: userId, passwordHash: await hashPassword(input.password) }),
    db.insert(employees).values({ id: employeeUuid, userId, employeeId, fullName: input.fullName, mobile: input.mobile, email: input.email, currentAddress: input.currentAddress, permanentAddress: input.permanentAddress, education: input.education, priorExperience: input.priorExperience }),
    db.insert(employeeRoles).values({ employeeId: employeeUuid, roleId: adminRole.id }),
  ]);
  await writeAuditLog(db, { targetUserId: userId, action: 'FIRST_ADMIN_PROVISIONED', entityType: 'employee', entityId: employeeUuid, description: 'Initial Admin provisioned through controlled operational workflow', newValue: { employeeId, role: 'ADMIN' } });
  return { employeeId };
}

export async function reviewRegistrationRequest(db: AppDatabase, actor: AuthContext, requestId: string, input: ReviewInput): Promise<{ employeeId?: string }> {
  const principal = await requirePermission(db, actor, 'employee.approve_registration');
  const [request] = await db.select().from(employeeRegistrationRequests).where(eq(employeeRegistrationRequests.id, requestId)).limit(1);
  if (!request) throw new AuthError(404, 'Registration request not found', 'NOT_FOUND');
  if (request.status !== 'PENDING') throw new AuthError(409, 'Registration request has already been reviewed', 'ALREADY_REVIEWED');

  if (input.action === 'REJECT') {
    const reason = input.rejectionReason?.trim() || 'Application declined during review';
    const now = new Date();
    await db.update(employeeRegistrationRequests).set({
      status: 'REJECTED',
      reviewedByUserId: principal.id,
      reviewedAt: now,
      rejectionReason: reason,
      updatedAt: now,
    }).where(and(eq(employeeRegistrationRequests.id, requestId), eq(employeeRegistrationRequests.status, 'PENDING')));

    await writeAuditLog(db, {
      performedByUserId: principal.id,
      action: 'REGISTRATION_REJECTED',
      entityType: 'employee_registration_request',
      entityId: requestId,
      description: `Employee registration request rejected: ${reason}`,
      newValue: { status: 'REJECTED', rejectionReason: reason },
    });
    return {};
  }

  const approvedRoleIds = input.roleIds!;
  const activeRoles = await db.select({ id: roles.id, code: roles.code, name: roles.name }).from(roles).where(and(inArray(roles.id, approvedRoleIds), eq(roles.isActive, true)));
  if (activeRoles.length !== approvedRoleIds.length) throw new AuthError(422, 'One or more selected roles are invalid or inactive', 'INVALID_ROLE');

  // Verify department and designation if provided
  let deptId: string | null = null;
  if (input.departmentId) {
    const [dept] = await db.select({ id: departments.id }).from(departments).where(and(eq(departments.id, input.departmentId), eq(departments.isActive, true))).limit(1);
    if (dept) deptId = dept.id;
  }
  let desigId: string | null = null;
  if (input.designationId) {
    const [desig] = await db.select({ id: designations.id }).from(designations).where(and(eq(designations.id, input.designationId), eq(designations.isActive, true))).limit(1);
    if (desig) desigId = desig.id;
  }

  const userId = crypto.randomUUID();
  const employeeUuid = crypto.randomUUID();
  const employeeId = await allocateEmployeeId(db);
  const now = new Date();
  const adminAssignedPasswordHash = await hashPassword(input.initialPassword!);

  await db.batch([
    db.insert(users).values({
      id: userId,
      passwordHash: adminAssignedPasswordHash,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    }),
    db.insert(employees).values({
      id: employeeUuid,
      userId,
      employeeId,
      fullName: request.fullName,
      mobile: request.mobile,
      email: request.email,
      dateOfBirth: request.dateOfBirth,
      currentAddress: request.currentAddress,
      permanentAddress: request.permanentAddress,
      education: request.education,
      priorExperience: request.priorExperience,
      departmentId: deptId,
      designationId: desigId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }),
    ...approvedRoleIds.map((roleId) =>
      db.insert(employeeRoles).values({
        employeeId: employeeUuid,
        roleId,
        assignedAt: now,
        assignedByUserId: principal.id,
      })
    ),
    db.update(employeeRegistrationRequests).set({
      status: 'APPROVED',
      reviewedByUserId: principal.id,
      reviewedAt: now,
      createdEmployeeId: employeeUuid,
      updatedAt: now,
    }).where(and(eq(employeeRegistrationRequests.id, requestId), eq(employeeRegistrationRequests.status, 'PENDING'))),
  ]);

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    targetUserId: userId,
    action: 'REGISTRATION_APPROVED',
    entityType: 'employee_registration_request',
    entityId: requestId,
    description: `Employee registration approved for ${request.fullName} (${employeeId})`,
    newValue: { employeeId, roles: activeRoles.map((r) => r.code) },
  });

  return { employeeId };
}

export async function listEmployees(db: AppDatabase, actor: AuthContext) {
  await requirePermission(db, actor, 'employee.read.company');
  const allEmployees = await db.select({
    id: employees.id,
    userId: employees.userId,
    employeeId: employees.employeeId,
    fullName: employees.fullName,
    email: employees.email,
    mobile: employees.mobile,
    dateOfBirth: employees.dateOfBirth,
    departmentId: employees.departmentId,
    departmentName: departments.name,
    departmentCode: departments.code,
    designationId: employees.designationId,
    designationName: designations.name,
    designationCode: designations.code,
    isActive: employees.isActive,
    userStatus: users.status,
    lastLoginAt: users.lastLoginAt,
    createdAt: employees.createdAt,
  })
  .from(employees)
  .innerJoin(users, eq(employees.userId, users.id))
  .leftJoin(departments, eq(employees.departmentId, departments.id))
  .leftJoin(designations, eq(employees.designationId, designations.id))
  .orderBy(employees.employeeId);

  const roleAssignments = await db.select({
    employeeId: employeeRoles.employeeId,
    roleId: roles.id,
    roleCode: roles.code,
    roleName: roles.name,
  })
  .from(employeeRoles)
  .innerJoin(roles, eq(employeeRoles.roleId, roles.id));

  const rolesMap = new Map<string, Array<{ id: string; code: string; name: string }>>();
  for (const r of roleAssignments) {
    const list = rolesMap.get(r.employeeId) || [];
    list.push({ id: r.roleId, code: r.roleCode, name: r.roleName });
    rolesMap.set(r.employeeId, list);
  }

  return allEmployees.map((emp) => ({
    ...emp,
    roles: rolesMap.get(emp.id) || [],
  }));
}

export async function getEmployeeDetail(db: AppDatabase, actor: AuthContext, employeeUuid: string) {
  const principal = await getPrincipal(db, actor);
  const permSet = await getPermissions(db, principal.id);
  const canReadCompany = permSet.has('employee.read.company') || permSet.has('*');

  const [emp] = await db.select({
    id: employees.id,
    userId: employees.userId,
    employeeId: employees.employeeId,
    fullName: employees.fullName,
    email: employees.email,
    mobile: employees.mobile,
    dateOfBirth: employees.dateOfBirth,
    currentAddress: employees.currentAddress,
    permanentAddress: employees.permanentAddress,
    education: employees.education,
    priorExperience: employees.priorExperience,
    departmentId: employees.departmentId,
    departmentName: departments.name,
    departmentCode: departments.code,
    designationId: employees.designationId,
    designationName: designations.name,
    designationCode: designations.code,
    isActive: employees.isActive,
    userStatus: users.status,
    lastLoginAt: users.lastLoginAt,
    createdAt: employees.createdAt,
  })
  .from(employees)
  .innerJoin(users, eq(employees.userId, users.id))
  .leftJoin(departments, eq(employees.departmentId, departments.id))
  .leftJoin(designations, eq(employees.designationId, designations.id))
  .where(eq(employees.id, employeeUuid))
  .limit(1);

  if (!emp) throw new AuthError(404, 'Employee not found', 'NOT_FOUND');
  if (!canReadCompany && emp.userId !== principal.id) {
    throw new AuthError(403, 'You are not authorized to view this employee record', 'FORBIDDEN');
  }

  const assignedRoles = await db.select({
    id: roles.id,
    code: roles.code,
    name: roles.name,
  })
  .from(employeeRoles)
  .innerJoin(roles, eq(employeeRoles.roleId, roles.id))
  .where(eq(employeeRoles.employeeId, emp.id));

  let overrides: Array<{ code: string; effect: 'GRANT' | 'DENY'; reason: string | null }> = [];
  if (canReadCompany) {
    overrides = await db.select({
      code: permissions.code,
      effect: employeePermissionOverrides.effect,
      reason: employeePermissionOverrides.reason,
    })
    .from(employeePermissionOverrides)
    .innerJoin(permissions, eq(employeePermissionOverrides.permissionId, permissions.id))
    .where(eq(employeePermissionOverrides.employeeId, emp.id));
  }

  let audits: Array<any> = [];
  if (canReadCompany && permSet.has('audit.read')) {
    audits = await db.select()
      .from(auditLogs)
      .where(or(eq(auditLogs.targetUserId, emp.userId), eq(auditLogs.entityId, emp.id)))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);
  }

  return {
    ...emp,
    roles: assignedRoles,
    permissionOverrides: overrides,
    recentAudits: audits,
  };
}

export async function updateEmployee(db: AppDatabase, actor: AuthContext, employeeUuid: string, input: UpdateEmployeeInput) {
  const principal = await requirePermission(db, actor, 'role.manage');
  const [emp] = await db.select().from(employees).where(eq(employees.id, employeeUuid)).limit(1);
  if (!emp) throw new AuthError(404, 'Employee not found', 'NOT_FOUND');

  const now = new Date();
  const updates: Record<string, any> = { updatedAt: now };

  if (input.fullName !== undefined) updates.fullName = input.fullName.trim();
  if (input.mobile !== undefined) updates.mobile = input.mobile.trim();
  if (input.departmentId !== undefined) updates.departmentId = input.departmentId || null;
  if (input.designationId !== undefined) updates.designationId = input.designationId || null;
  if (input.currentAddress !== undefined) updates.currentAddress = input.currentAddress.trim();
  if (input.permanentAddress !== undefined) updates.permanentAddress = input.permanentAddress.trim();
  if (input.isActive !== undefined) updates.isActive = input.isActive;

  await db.update(employees).set(updates).where(eq(employees.id, employeeUuid));

  if (input.isActive !== undefined) {
    await db.update(users).set({
      status: input.isActive ? 'ACTIVE' : 'DISABLED',
      updatedAt: now,
    }).where(eq(users.id, emp.userId));

    if (!input.isActive) {
      await db.update(sessions).set({ revokedAt: now }).where(and(eq(sessions.userId, emp.userId), isNull(sessions.revokedAt)));
    }
  }

  if (input.roleIds) {
    const validRoles = await db.select({ id: roles.id, code: roles.code }).from(roles).where(and(inArray(roles.id, input.roleIds), eq(roles.isActive, true)));
    if (validRoles.length !== input.roleIds.length) {
      throw new AuthError(422, 'One or more specified roles are invalid or inactive', 'INVALID_ROLE');
    }

    await db.delete(employeeRoles).where(eq(employeeRoles.employeeId, employeeUuid));
    for (const roleId of input.roleIds) {
      await db.insert(employeeRoles).values({
        employeeId: employeeUuid,
        roleId,
        assignedAt: now,
        assignedByUserId: principal.id,
      });
    }
  }

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    targetUserId: emp.userId,
    action: 'EMPLOYEE_UPDATED',
    entityType: 'employee',
    entityId: employeeUuid,
    description: `Employee ${emp.employeeId} (${emp.fullName}) updated`,
    newValue: updates,
  });

  return { success: true };
}

export async function getAdminMetadata(db: AppDatabase, actor: AuthContext) {
  await requirePermission(db, actor, 'employee.read.company');
  const [deptList, desigList, roleList] = await Promise.all([
    db.select({ id: departments.id, name: departments.name, code: departments.code }).from(departments).where(eq(departments.isActive, true)),
    db.select({ id: designations.id, departmentId: designations.departmentId, name: designations.name, code: designations.code }).from(designations).where(eq(designations.isActive, true)),
    db.select({ id: roles.id, name: roles.name, code: roles.code, description: roles.description, dataScope: roles.dataScope }).from(roles).where(eq(roles.isActive, true)),
  ]);

  return {
    departments: deptList,
    designations: desigList,
    roles: roleList,
  };
}
