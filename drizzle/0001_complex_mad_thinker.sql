CREATE TABLE IF NOT EXISTS `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`company_name` text NOT NULL,
	`email` text,
	`phone` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`assigned_employee_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`assigned_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `clients_assigned_emp_idx` ON `clients` (`assigned_employee_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `daily_work_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`report_date` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`calls_count` integer DEFAULT 0 NOT NULL,
	`meetings_count` integer DEFAULT 0 NOT NULL,
	`follow_ups_count` integer DEFAULT 0 NOT NULL,
	`deals_summary` text,
	`completed_tasks_summary` text,
	`pending_tasks_summary` text,
	`notes` text,
	`submitted_at` integer,
	`reviewed_by_employee_id` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `daily_reports_emp_date_unique` ON `daily_work_reports` (`employee_id`,`report_date`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `daily_reports_status_idx` ON `daily_work_reports` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `daily_reports_emp_idx` ON `daily_work_reports` (`employee_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `employee_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`period_type` text DEFAULT 'MONTHLY' NOT NULL,
	`period_start` text,
	`period_end` text,
	`target_amount` integer DEFAULT 0 NOT NULL,
	`achieved_amount` integer DEFAULT 0 NOT NULL,
	`target_calls` integer DEFAULT 0,
	`target_meetings` integer DEFAULT 0,
	`target_deals` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `emp_targets_emp_idx` ON `employee_targets` (`employee_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `follow_ups` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`date` integer NOT NULL,
	`type` text DEFAULT 'CALL' NOT NULL,
	`status` text DEFAULT 'UPCOMING' NOT NULL,
	`outcome` text,
	`next_action` text,
	`next_follow_up_date` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `follow_ups_emp_idx` ON `follow_ups` (`employee_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `follow_ups_status_idx` ON `follow_ups` (`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `meetings` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`title` text NOT NULL,
	`scheduled_at` integer NOT NULL,
	`status` text DEFAULT 'SCHEDULED' NOT NULL,
	`notes` text,
	`outcome` text,
	`next_action` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `meetings_emp_idx` ON `meetings` (`employee_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `meetings_scheduled_idx` ON `meetings` (`scheduled_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `opportunities` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`owner_employee_id` text NOT NULL,
	`title` text NOT NULL,
	`stage` text DEFAULT 'OPPORTUNITY' NOT NULL,
	`estimated_value` integer DEFAULT 0 NOT NULL,
	`probability` integer DEFAULT 50,
	`expected_close_date` integer,
	`next_action` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `opps_owner_idx` ON `opportunities` (`owner_employee_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `opps_stage_idx` ON `opportunities` (`stage`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `task_delay_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`requested_by_employee_id` text NOT NULL,
	`original_due_date` integer NOT NULL,
	`requested_due_date` integer NOT NULL,
	`reason` text NOT NULL,
	`business_impact` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`reviewed_by_employee_id` text,
	`review_remarks` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requested_by_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `task_delay_status_idx` ON `task_delay_requests` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `task_delay_task_idx` ON `task_delay_requests` (`task_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`assigned_to_employee_id` text NOT NULL,
	`assigned_by_employee_id` text NOT NULL,
	`client_id` text,
	`priority` text DEFAULT 'P2' NOT NULL,
	`status` text DEFAULT 'TODO' NOT NULL,
	`original_due_date` integer NOT NULL,
	`current_due_date` integer NOT NULL,
	`evidence` text,
	`evidence_type` text,
	`maker_notes` text,
	`checker_notes` text,
	`verified_by_employee_id` text,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`assigned_to_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_by_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`verified_by_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tasks_assigned_to_idx` ON `tasks` (`assigned_to_employee_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tasks_assigned_by_idx` ON `tasks` (`assigned_by_employee_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tasks_status_idx` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tasks_due_idx` ON `tasks` (`current_due_date`);--> statement-breakpoint
INSERT OR IGNORE INTO `permissions` (`id`, `code`, `description`) VALUES
  ('a0000000-0000-4000-8000-000000000010', 'task.execute', 'Execute and update assigned tasks'),
  ('a0000000-0000-4000-8000-000000000011', 'task.create', 'Create operational tasks'),
  ('a0000000-0000-4000-8000-000000000012', 'task.assign', 'Assign tasks to team members'),
  ('a0000000-0000-4000-8000-000000000013', 'task.verify', 'Verify completed tasks with evidence'),
  ('a0000000-0000-4000-8000-000000000014', 'client.read', 'Read client records'),
  ('a0000000-0000-4000-8000-000000000015', 'client.manage', 'Create and manage client records'),
  ('a0000000-0000-4000-8000-000000000016', 'opportunity.read', 'Read sales and opportunity records'),
  ('a0000000-0000-4000-8000-000000000017', 'opportunity.manage', 'Manage opportunities and deals'),
  ('a0000000-0000-4000-8000-000000000018', 'report.submit', 'Submit daily work reports'),
  ('a0000000-0000-4000-8000-000000000019', 'report.review', 'Review and approve/reject team daily reports'),
  ('a0000000-0000-4000-8000-000000000020', 'team.manage', 'Manage assigned team operations'),
  ('a0000000-0000-4000-8000-000000000021', 'delay.approve', 'Review and approve task delay requests');--> statement-breakpoint
INSERT OR IGNORE INTO `role_permissions` (`role_id`, `permission_id`) VALUES
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000010'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000011'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000012'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000013'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000014'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000015'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000016'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000017'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000018'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000019'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000020'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 'a0000000-0000-4000-8000-000000000021'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000010'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000011'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000012'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000013'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000014'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000015'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000016'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000017'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000018'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000019'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000020'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 'a0000000-0000-4000-8000-000000000021'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4004', 'a0000000-0000-4000-8000-000000000010'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4004', 'a0000000-0000-4000-8000-000000000014'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4004', 'a0000000-0000-4000-8000-000000000016'),
  ('8dc8f112-1c8d-4c70-9cf3-0a250f2f4004', 'a0000000-0000-4000-8000-000000000018');