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

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  companyName: text('company_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  status: text('status', { enum: ['ACTIVE', 'LEAD', 'INACTIVE'] }).notNull().default('ACTIVE'),
  assignedEmployeeId: text('assigned_employee_id').references(() => employees.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (t) => [index('clients_assigned_emp_idx').on(t.assignedEmployeeId)]);

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  assignedToEmployeeId: text('assigned_to_employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  assignedByEmployeeId: text('assigned_by_employee_id').notNull().references(() => employees.id, { onDelete: 'restrict' }),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),
  priority: text('priority', { enum: ['P1', 'P2', 'P3'] }).notNull().default('P2'),
  status: text('status', { enum: ['TODO', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'COMPLETED', 'OVERDUE', 'CANCELLED'] }).notNull().default('TODO'),
  originalDueDate: integer('original_due_date', { mode: 'timestamp_ms' }).notNull(),
  currentDueDate: integer('current_due_date', { mode: 'timestamp_ms' }).notNull(),
  evidence: text('evidence'),
  evidenceType: text('evidence_type', { enum: ['DOCUMENT', 'EMAIL', 'NOTE', 'LINK'] }),
  makerNotes: text('maker_notes'),
  checkerNotes: text('checker_notes'),
  verifiedByEmployeeId: text('verified_by_employee_id').references(() => employees.id, { onDelete: 'set null' }),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (t) => [
  index('tasks_assigned_to_idx').on(t.assignedToEmployeeId),
  index('tasks_assigned_by_idx').on(t.assignedByEmployeeId),
  index('tasks_status_idx').on(t.status),
  index('tasks_due_idx').on(t.currentDueDate),
]);

export const taskDelayRequests = sqliteTable('task_delay_requests', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  requestedByEmployeeId: text('requested_by_employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  originalDueDate: integer('original_due_date', { mode: 'timestamp_ms' }).notNull(),
  requestedDueDate: integer('requested_due_date', { mode: 'timestamp_ms' }).notNull(),
  reason: text('reason').notNull(),
  businessImpact: text('business_impact'),
  status: text('status', { enum: ['PENDING', 'APPROVED', 'REJECTED'] }).notNull().default('PENDING'),
  reviewedByEmployeeId: text('reviewed_by_employee_id').references(() => employees.id, { onDelete: 'set null' }),
  reviewRemarks: text('review_remarks'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (t) => [index('task_delay_status_idx').on(t.status), index('task_delay_task_idx').on(t.taskId)]);

export const followUps = sqliteTable('follow_ups', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  type: text('type', { enum: ['CALL', 'EMAIL', 'MEETING', 'DEMO'] }).notNull().default('CALL'),
  status: text('status', { enum: ['UPCOMING', 'COMPLETED', 'OVERDUE', 'CANCELLED'] }).notNull().default('UPCOMING'),
  outcome: text('outcome'),
  nextAction: text('next_action'),
  nextFollowUpDate: integer('next_follow_up_date', { mode: 'timestamp_ms' }),
  notes: text('notes'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (t) => [index('follow_ups_emp_idx').on(t.employeeId), index('follow_ups_status_idx').on(t.status)]);

export const meetings = sqliteTable('meetings', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp_ms' }).notNull(),
  status: text('status', { enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'] }).notNull().default('SCHEDULED'),
  notes: text('notes'),
  outcome: text('outcome'),
  nextAction: text('next_action'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (t) => [index('meetings_emp_idx').on(t.employeeId), index('meetings_scheduled_idx').on(t.scheduledAt)]);

export const opportunities = sqliteTable('opportunities', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  ownerEmployeeId: text('owner_employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  stage: text('stage', { enum: ['OPPORTUNITY', 'PROPOSAL', 'CONVERSION', 'WON', 'LOST'] }).notNull().default('OPPORTUNITY'),
  estimatedValue: integer('estimated_value').notNull().default(0),
  probability: integer('probability').default(50),
  expectedCloseDate: integer('expected_close_date', { mode: 'timestamp_ms' }),
  nextAction: text('next_action'),
  status: text('status', { enum: ['ACTIVE', 'CLOSED'] }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (t) => [index('opps_owner_idx').on(t.ownerEmployeeId), index('opps_stage_idx').on(t.stage)]);

export const dailyWorkReports = sqliteTable('daily_work_reports', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  reportDate: text('report_date').notNull(),
  status: text('status', { enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] }).notNull().default('DRAFT'),
  callsCount: integer('calls_count').notNull().default(0),
  meetingsCount: integer('meetings_count').notNull().default(0),
  followUpsCount: integer('follow_ups_count').notNull().default(0),
  dealsSummary: text('deals_summary'),
  completedTasksSummary: text('completed_tasks_summary'),
  pendingTasksSummary: text('pending_tasks_summary'),
  notes: text('notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }),
  reviewedByEmployeeId: text('reviewed_by_employee_id').references(() => employees.id, { onDelete: 'set null' }),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (t) => [
  uniqueIndex('daily_reports_emp_date_unique').on(t.employeeId, t.reportDate),
  index('daily_reports_status_idx').on(t.status),
  index('daily_reports_emp_idx').on(t.employeeId),
]);

export const employeeTargets = sqliteTable('employee_targets', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  periodType: text('period_type', { enum: ['WEEKLY', 'MONTHLY'] }).notNull().default('MONTHLY'),
  periodStart: text('period_start'),
  periodEnd: text('period_end'),
  targetAmount: integer('target_amount').notNull().default(0),
  achievedAmount: integer('achieved_amount').notNull().default(0),
  targetCalls: integer('target_calls').default(0),
  targetMeetings: integer('target_meetings').default(0),
  targetDeals: integer('target_deals').default(0),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (t) => [index('emp_targets_emp_idx').on(t.employeeId)]);

export const vendors = sqliteTable('vendors', {
  id: text('id').primaryKey(),
  vendorId: text('vendor_id').notNull(),
  name: text('name').notNull(),
  category: text('category', { enum: ['FABRICATION', 'LOGISTICS', 'PRINTING', 'EQUIPMENT', 'VENUE', 'CREATIVE', 'OTHER'] }).notNull().default('FABRICATION'),
  contactPerson: text('contact_person').notNull(),
  phone: text('phone'),
  email: text('email'),
  location: text('location'),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  assignedEmployeeId: text('assigned_employee_id').references(() => employees.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (t) => [
  uniqueIndex('vendors_vendor_id_unique').on(t.vendorId),
  index('vendors_status_idx').on(t.status),
]);

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  projectCode: text('project_code').notNull(),
  title: text('title').notNull(),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),
  ownerEmployeeId: text('owner_employee_id').notNull().references(() => employees.id, { onDelete: 'restrict' }),
  vendorId: text('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['FABRICATION', 'DISPATCH', 'SETUP', 'LIVE', 'DISMANTLE', 'CLOSURE_PACK', 'COMPLETED', 'CANCELLED'] }).notNull().default('FABRICATION'),
  budget: integer('budget').notNull().default(0),
  startDate: integer('start_date', { mode: 'timestamp_ms' }),
  targetDate: integer('target_date', { mode: 'timestamp_ms' }),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (t) => [
  uniqueIndex('projects_code_unique').on(t.projectCode),
  index('projects_status_idx').on(t.status),
  index('projects_client_idx').on(t.clientId),
  index('projects_owner_idx').on(t.ownerEmployeeId),
]);

export const projectMilestones = sqliteTable('project_milestones', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  stage: text('stage', { enum: ['FABRICATION', 'DISPATCH', 'SETUP', 'LIVE', 'DISMANTLE', 'CLOSURE_PACK'] }).notNull(),
  dueDate: integer('due_date', { mode: 'timestamp_ms' }),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  status: text('status', { enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] }).notNull().default('PENDING'),
  notes: text('notes'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (t) => [
  index('milestones_project_idx').on(t.projectId),
  index('milestones_status_idx').on(t.status),
]);

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'restrict' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  amount: integer('amount').notNull(),
  issueDate: integer('issue_date', { mode: 'timestamp_ms' }).notNull(),
  dueDate: integer('due_date', { mode: 'timestamp_ms' }).notNull(),
  status: text('status', { enum: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] }).notNull().default('ISSUED'),
  notes: text('notes'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (t) => [
  uniqueIndex('invoices_number_unique').on(t.invoiceNumber),
  index('invoices_client_idx').on(t.clientId),
  index('invoices_status_idx').on(t.status),
  index('invoices_due_idx').on(t.dueDate),
]);

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  paymentDate: integer('payment_date', { mode: 'timestamp_ms' }).notNull(),
  paymentMethod: text('payment_method', { enum: ['BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'] }).default('BANK_TRANSFER'),
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  createdAt: timestamp('created_at'),
}, (t) => [
  index('payments_invoice_idx').on(t.invoiceId),
]);

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  department: one(departments, { fields: [employees.departmentId], references: [departments.id] }),
  designation: one(designations, { fields: [employees.designationId], references: [designations.id] }),
  manager: one(employees, { fields: [employees.managerEmployeeId], references: [employees.id], relationName: 'managerTeam' }),
  teamMembers: many(employees, { relationName: 'managerTeam' }),
  roles: many(employeeRoles),
  permissionOverrides: many(employeePermissionOverrides),
  assignedTasks: many(tasks, { relationName: 'taskAssignee' }),
  createdTasks: many(tasks, { relationName: 'taskCreator' }),
  assignedClients: many(clients),
  followUps: many(followUps),
  meetings: many(meetings),
  opportunities: many(opportunities),
  dailyReports: many(dailyWorkReports),
  targets: many(employeeTargets),
  projects: many(projects),
  vendors: many(vendors),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignedTo: one(employees, { fields: [tasks.assignedToEmployeeId], references: [employees.id], relationName: 'taskAssignee' }),
  assignedBy: one(employees, { fields: [tasks.assignedByEmployeeId], references: [employees.id], relationName: 'taskCreator' }),
  client: one(clients, { fields: [tasks.clientId], references: [clients.id] }),
  delayRequests: many(taskDelayRequests),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  assignedEmployee: one(employees, { fields: [clients.assignedEmployeeId], references: [employees.id] }),
  tasks: many(tasks),
  followUps: many(followUps),
  meetings: many(meetings),
  opportunities: many(opportunities),
  projects: many(projects),
  invoices: many(invoices),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  assignedEmployee: one(employees, { fields: [vendors.assignedEmployeeId], references: [employees.id] }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  owner: one(employees, { fields: [projects.ownerEmployeeId], references: [employees.id] }),
  vendor: one(vendors, { fields: [projects.vendorId], references: [vendors.id] }),
  milestones: many(projectMilestones),
  invoices: many(invoices),
}));

export const projectMilestonesRelations = relations(projectMilestones, ({ one }) => ({
  project: one(projects, { fields: [projectMilestones.projectId], references: [projects.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  project: one(projects, { fields: [invoices.projectId], references: [projects.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees),
  sessions: many(sessions),
}));
