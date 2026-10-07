CREATE TABLE IF NOT EXISTS `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` text NOT NULL,
	`client_id` text NOT NULL,
	`project_id` text,
	`amount` integer NOT NULL,
	`issue_date` integer NOT NULL,
	`due_date` integer NOT NULL,
	`status` text DEFAULT 'ISSUED' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `invoices_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `invoices_client_idx` ON `invoices` (`client_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `invoices_status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `invoices_due_idx` ON `invoices` (`due_date`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`amount` integer NOT NULL,
	`payment_date` integer NOT NULL,
	`payment_method` text DEFAULT 'BANK_TRANSFER',
	`reference_number` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `payments_invoice_idx` ON `payments` (`invoice_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `project_milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`stage` text NOT NULL,
	`due_date` integer,
	`completed_at` integer,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `milestones_project_idx` ON `project_milestones` (`project_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `milestones_status_idx` ON `project_milestones` (`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`project_code` text NOT NULL,
	`title` text NOT NULL,
	`client_id` text,
	`owner_employee_id` text NOT NULL,
	`vendor_id` text,
	`status` text DEFAULT 'FABRICATION' NOT NULL,
	`budget` integer DEFAULT 0 NOT NULL,
	`start_date` integer,
	`target_date` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`owner_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `projects_code_unique` ON `projects` (`project_code`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `projects_client_idx` ON `projects` (`client_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `projects_owner_idx` ON `projects` (`owner_employee_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'FABRICATION' NOT NULL,
	`contact_person` text NOT NULL,
	`phone` text,
	`email` text,
	`location` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`assigned_employee_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`assigned_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `vendors_vendor_id_unique` ON `vendors` (`vendor_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `vendors_status_idx` ON `vendors` (`status`);