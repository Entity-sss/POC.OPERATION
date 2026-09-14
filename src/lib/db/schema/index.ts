import { relations, sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const timestamp = (name: string) => integer(name, { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`);

export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(), name: text('name').notNull(), code: text('code').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true), createdAt: timestamp('created_at'), updatedAt: timestamp('updated_at'),
}, (t) => [uniqueIndex('departments_code_unique').on(t.code)]);

export const designations = sqliteTable('designations', {
  id: text('id').primaryKey(), departmentId: text('department_id').references(() => departments.id, { onDelete: 'restrict' }),
  name: text('name').notNull(), code: text('code').notNull(), isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true), createdAt: timestamp('created_at'), updatedAt: timestamp('updated_at'),
}, (t) => [uniqueIndex('designations_code_unique').on(t.code)]);

export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(), name: text('name').notNull(), code: text('code').notNull(), description: text('description'),
  dataScope: text('data_scope', { enum: ['SELF', 'TEAM', 'COMPANY'] }).notNull().default('SELF'), isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false), isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true), createdAt: timestamp('created_at'), updatedAt: timestamp('updated_at'),
}, (t) => [uniqueIndex('roles_code_unique').on(t.code)]);

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(), code: text('code').notNull(), description: text('description').notNull(), createdAt: timestamp('created_at'),
}, (t) => [uniqueIndex('permissions_code_unique').on(t.code)]);

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), passwordHash: text('password_hash').notNull(), status: text('status', { enum: ['ACTIVE', 'DISABLED'] }).notNull().default('ACTIVE'), lastLoginAt: integer('last_login_at', { mode: 'timestamp_ms' }), createdAt: timestamp('created_at'), updatedAt: timestamp('updated_at'),
});

export const employeeIdSequences = sqliteTable('employee_id_sequences', {
  name: text('name').primaryKey(), nextValue: integer('next_value').notNull(), updatedAt: timestamp('updated_at'),
});

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }), employeeId: text('employee_id').notNull(), fullName: text('full_name').notNull(), mobile: text('mobile').notNull(), email: text('email').notNull(), dateOfBirth: text('date_of_birth'), currentAddress: text('current_address'), permanentAddress: text('permanent_address'), education: text('education'), priorExperience: text('prior_experience'), departmentId: text('department_id').references(() => departments.id, { onDelete: 'restrict' }), designationId: text('designation_id').references(() => designations.id, { onDelete: 'restrict' }), managerEmployeeId: text('manager_employee_id').references((): any => employees.id, { onDelete: 'restrict' }), isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true), createdAt: timestamp('created_at'), updatedAt: timestamp('updated_at'),
}, (t) => [uniqueIndex('employees_user_id_unique').on(t.userId), uniqueIndex('employees_employee_id_unique').on(t.employeeId), uniqueIndex('employees_email_unique').on(t.email), index('employees_department_idx').on(t.departmentId)]);

export const employeeRoles = sqliteTable('employee_roles', {
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }), roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }), assignedAt: timestamp('assigned_at'), assignedByUserId: text('assigned_by_user_id').references(() => users.id, { onDelete: 'restrict' }),
}, (t) => [primaryKey({ columns: [t.employeeId, t.roleId] })]);

export const rolePermissions = sqliteTable('role_permissions', {
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }), permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }), createdAt: timestamp('created_at'),
}, (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })]);

export const employeePermissionOverrides = sqliteTable('employee_permission_overrides', {
  id: text('id').primaryKey(), employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }), permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }), effect: text('effect', { enum: ['GRANT', 'DENY'] }).notNull(), reason: text('reason'), createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'restrict' }), createdAt: timestamp('created_at'),
}, (t) => [uniqueIndex('employee_permission_overrides_unique').on(t.employeeId, t.permissionId)]);

export const employeeRegistrationRequests = sqliteTable('employee_registration_requests', {
  id: text('id').primaryKey(), fullName: text('full_name').notNull(), mobile: text('mobile').notNull(), email: text('email').notNull(), dateOfBirth: text('date_of_birth'), currentAddress: text('current_address').notNull(), permanentAddress: text('permanent_address').notNull(), education: text('education').notNull(), priorExperience: text('prior_experience').notNull(), passwordHash: text('password_hash').notNull(), status: text('status', { enum: ['PENDING', 'APPROVED', 'REJECTED'] }).notNull().default('PENDING'), reviewedByUserId: text('reviewed_by_user_id').references(() => users.id, { onDelete: 'restrict' }), reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }), rejectionReason: text('rejection_reason'), createdEmployeeId: text('created_employee_id').references(() => employees.id, { onDelete: 'restrict' }), createdAt: timestamp('created_at'), updatedAt: timestamp('updated_at'),
}, (t) => [index('registration_requests_status_idx').on(t.status), index('registration_requests_email_idx').on(t.email)]);

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), tokenHash: text('token_hash').notNull(), expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(), revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }), lastSeenAt: timestamp('last_seen_at'), createdAt: timestamp('created_at'),
}, (t) => [uniqueIndex('sessions_token_hash_unique').on(t.tokenHash), index('sessions_user_id_idx').on(t.userId), index('sessions_expires_at_idx').on(t.expiresAt)]);

export const authRateLimits = sqliteTable('auth_rate_limits', {
  key: text('key').primaryKey(), attempts: integer('attempts').notNull().default(0), windowStartedAt: integer('window_started_at', { mode: 'timestamp_ms' }).notNull(), blockedUntil: integer('blocked_until', { mode: 'timestamp_ms' }), updatedAt: timestamp('updated_at'),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(), performedByUserId: text('performed_by_user_id').references(() => users.id, { onDelete: 'restrict' }), targetUserId: text('target_user_id').references(() => users.id, { onDelete: 'restrict' }), action: text('action').notNull(), entityType: text('entity_type').notNull(), entityId: text('entity_id'), oldValue: text('old_value'), newValue: text('new_value'), description: text('description').notNull(), createdAt: timestamp('created_at'),
}, (t) => [index('audit_logs_entity_idx').on(t.entityType, t.entityId), index('audit_logs_performed_by_idx').on(t.performedByUserId)]);

export const employeesRelations = relations(employees, ({ one, many }) => ({ user: one(users, { fields: [employees.userId], references: [users.id] }), department: one(departments, { fields: [employees.departmentId], references: [departments.id] }), designation: one(designations, { fields: [employees.designationId], references: [designations.id] }), roles: many(employeeRoles), permissionOverrides: many(employeePermissionOverrides) }));
export const usersRelations = relations(users, ({ one, many }) => ({ employee: one(employees), sessions: many(sessions) }));
