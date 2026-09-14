CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`performed_by_user_id` text,
	`target_user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`old_value` text,
	`new_value` text,
	`description` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`performed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_performed_by_idx` ON `audit_logs` (`performed_by_user_id`);--> statement-breakpoint
CREATE TABLE `auth_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`window_started_at` integer NOT NULL,
	`blocked_until` integer,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_code_unique` ON `departments` (`code`);--> statement-breakpoint
CREATE TABLE `designations` (
	`id` text PRIMARY KEY NOT NULL,
	`department_id` text,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `designations_code_unique` ON `designations` (`code`);--> statement-breakpoint
CREATE TABLE `employee_id_sequences` (
	`name` text PRIMARY KEY NOT NULL,
	`next_value` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `employee_permission_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`effect` text NOT NULL,
	`reason` text,
	`created_by_user_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employee_permission_overrides_unique` ON `employee_permission_overrides` (`employee_id`,`permission_id`);--> statement-breakpoint
CREATE TABLE `employee_registration_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`mobile` text NOT NULL,
	`email` text NOT NULL,
	`date_of_birth` text,
	`current_address` text NOT NULL,
	`permanent_address` text NOT NULL,
	`education` text NOT NULL,
	`prior_experience` text NOT NULL,
	`password_hash` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`reviewed_by_user_id` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	`created_employee_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `registration_requests_status_idx` ON `employee_registration_requests` (`status`);--> statement-breakpoint
CREATE INDEX `registration_requests_email_idx` ON `employee_registration_requests` (`email`);--> statement-breakpoint
CREATE TABLE `employee_roles` (
	`employee_id` text NOT NULL,
	`role_id` text NOT NULL,
	`assigned_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`assigned_by_user_id` text,
	PRIMARY KEY(`employee_id`, `role_id`),
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`full_name` text NOT NULL,
	`mobile` text NOT NULL,
	`email` text NOT NULL,
	`date_of_birth` text,
	`current_address` text,
	`permanent_address` text,
	`education` text,
	`prior_experience` text,
	`department_id` text,
	`designation_id` text,
	`manager_employee_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`designation_id`) REFERENCES `designations`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`manager_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_user_id_unique` ON `employees` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_id_unique` ON `employees` (`employee_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);--> statement-breakpoint
CREATE INDEX `employees_department_idx` ON `employees` (`department_id`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_code_unique` ON `permissions` (`code`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`role_id`, `permission_id`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`data_scope` text DEFAULT 'SELF' NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_code_unique` ON `roles` (`code`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`last_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `employee_id_sequences` (`name`, `next_value`) VALUES ('EMPLOYEE', 1001);
--> statement-breakpoint
INSERT INTO `roles` (`id`, `name`, `code`, `description`, `data_scope`, `is_system`) VALUES
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4001', 'CEO / Business Head', 'CEO', 'Company-wide business authority', 'COMPANY', true),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'Admin / Host', 'ADMIN', 'System administration authority', 'COMPANY', true),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'Manager / Revenue Lead', 'MANAGER', 'Assigned team management authority', 'TEAM', true),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4004', 'Employee / Revenue Pod Member', 'EMPLOYEE', 'Employee operational access', 'SELF', true),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4005', 'Intern', 'INTERN', 'Restricted employee access', 'SELF', true),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4006', 'Operations', 'OPERATIONS', 'Operations execution access', 'SELF', true),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4007', 'Finance', 'FINANCE', 'Finance operational access', 'SELF', true);
--> statement-breakpoint
INSERT INTO `permissions` (`id`, `code`, `description`) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'employee.read.self', 'Read own employee record'),
  ('a0000000-0000-4000-8000-000000000002', 'employee.read.team', 'Read assigned team employee records'),
  ('a0000000-0000-4000-8000-000000000003', 'employee.read.company', 'Read company employee records'),
  ('a0000000-0000-4000-8000-000000000004', 'employee.approve_registration', 'Approve or reject employee registrations'),
  ('a0000000-0000-4000-8000-000000000005', 'role.manage', 'Manage role assignments'),
  ('a0000000-0000-4000-8000-000000000006', 'permission.manage', 'Manage permissions and overrides'),
  ('a0000000-0000-4000-8000-000000000007', 'audit.read', 'Read audit logs');
--> statement-breakpoint
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000001'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000002'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000003'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000004'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000005'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000006'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000007'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000001'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000002'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4004', 'a0000000-0000-4000-8000-000000000001'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4005', 'a0000000-0000-4000-8000-000000000001'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4006', 'a0000000-0000-4000-8000-000000000001'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4007', 'a0000000-0000-4000-8000-000000000001');
