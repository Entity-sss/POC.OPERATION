# POC.OPERATION Architecture

## Overview

POC.OPERATION is a Cloudflare Workers + Astro SSR application for Pinnacle’s internal operations platform. It is designed around a server-authoritative pattern in which the UI does not decide authorization or business truth; the database and service layer do.

The real functional architecture is:

UI -> API route -> authentication context -> authorization + scope -> validation -> service -> D1 -> audit -> response -> client refresh

This document describes the current implementation and intentionally does not claim features that are not actually present in the repository.

## 1. Application architecture

### Frontend
- Astro SSR with React islands for interactive dashboards and forms
- Cloudflare adapter for server-side rendering and Worker execution
- Tailwind CSS for the design system
- Route-based dashboard shell with hash-based workspace selection inside the authenticated app

### Backend
- Astro API endpoints under `src/pages/api`
- Service-layer business logic under `src/lib/auth/service.ts` and related modules
- D1 database access through Drizzle ORM
- Cloudflare Worker runtime for the main application and first-admin provisioning worker

### Data flow
- Requests are authenticated via session cookie and token hash lookup in D1
- The current user is resolved to an `AuthContext`
- Permission checks are computed from the employee role + permission graph
- Scoped read/write operations are enforced in the service layer before DB queries
- Audit logs are inserted on key actions

## 2. Authentication

Authentication is implemented in `src/lib/auth/service.ts` and `src/pages/api/auth/*`.

### Session model
- `users` stores the user identity and password hash
- `sessions` stores the opaque session token hash, expiry, and revocation state
- Session cookie is created by the API route and validated on each request

### Login flow
1. User submits employee ID or email and password
2. API validates input via Zod schema
3. Service resolves the employee record and verifies password hash using PBKDF2
4. If valid, it creates a session and records a login audit entry
5. Auth context is returned to the UI and session cookie is set

### Password handling
- Passwords are never stored in plaintext
- Password hashing uses PBKDF2 with SHA-256 and 600,000 iterations
- Hash format is stored with the salt and iteration count

## 3. RBAC and data scope

Authorization is permission-based and tied to employee roles.

### Entities
- `roles`
- `permissions`
- `role_permissions`
- `employee_roles`
- `employee_permission_overrides`

### Permission model
- Permissions are explicitly granted via role assignments
- Overrides can add or deny a given permission for a specific employee
- The effective permission set is taken from the role graph and overrides

### Data scope
The application currently models roles with a `data_scope` field (`SELF`, `TEAM`, `COMPANY`). This is used to determine which records a user may access in principle, while actual record-level enforcement is performed in service code and API route authorization checks.

## 4. Organization structure

The system is intended to model Pinnacle’s operating organization rather than a generic starter app.

Current business structure represented in planning documents includes:
- Business Head / CEO
- Admin / Host
- Revenue Pod 1 and Revenue Pod 2 responsibilities
- Operations
- Finance
- Vendor / procurement functions
- Shared services roles

The repo includes design and specification documents describing the intended organization. The actual live records are not yet fully migrated into D1 from demo seed data, so the system is structured for final organization migration but is not yet fully populated with the real current Pinnacle employee set.

## 5. Employee lifecycle

The employee lifecycle is handled through:
- registration request creation
- admin review and approval/rejection
- employee record creation
- role assignment
- password initialization
- active/inactive status
- audit logging

The main flow is:

Application -> API -> D1 -> pending queue -> admin review -> approval/rejection -> employee account -> login

## 6. CRM and opportunities

CRM objects exist in the schema and service layer:
- `clients`
- `opportunities`
- `follow_ups`
- `meetings`

The live app uses client and opportunity management workspaces and connects them to team and executive views. The system supports the revenue pipeline lifecycle from activity to opportunity to project and invoice.

## 7. Tasks and maker-checker

Task management is implemented in the schema and services:
- `tasks`
- `task_delay_requests`

The task lifecycle is:
- TODO
- IN_PROGRESS
- PENDING_VERIFICATION
- COMPLETED
- OVERDUE
- CANCELLED

Maker-checker enforcement protects controlled workflows so a person cannot verify their own task or report without a distinct checker.

## 8. Delay approvals

Delay approval is implemented with the `task_delay_requests` table and review flow in the manager API.

The system retains:
- original due date
- requested revised due date
- reason
- business impact
- approval status
- reviewer id
- reviewer remarks

## 9. Projects and operations

Projects and milestones are represented in the schema:
- `projects`
- `project_milestones`
- related client and vendor records

The lifecycle includes fabrication, dispatch, setup, live, dismantle, and closure stages.

## 10. Vendors and finance

Vendor management is implemented with the `vendors` table and vendor assignments on projects.
Finance tables include:
- `invoices`
- `payments`
- collection-related structures where present in the schema and service APIs

## 11. Notifications and automation

The repository includes notification and search API surfaces, but the automation architecture is not yet fully activated against live business events and should be treated as a real production boundary rather than a fake automation UI.

## 12. D1, R2, KV and Cloudflare

### D1
The app uses Cloudflare D1 for all transactional data.

### R2
The codebase does not demonstrate a live public/private document store in service; it is prepared as a secure document boundary concept rather than a fully wired private document system.

### KV
There is no evidence of a live production KV dependency in the current app implementation; the app uses D1-backed session storage and runtime state instead.

### Workers
- Main app worker: Astro Cloudflare server output
- Provisioning worker: `src/provisioning/first-admin-worker.ts`, used for a controlled one-time admin bootstrap path

## 13. Deployment architecture

The production deployment model is a standard Cloudflare Workers deployment with:
- D1 binding for `poc_operation_db`
- Cloudflare queue-less server runtime
- static assets via Worker assets binding
- server SSR by Astro Cloudflare adapter

## 14. Performance

Performance work is centered on:
- lazy-loading major dashboard workspaces
- keeping the initial dashboard shell light
- parallel D1 queries where independent
- avoiding heavy client-side hydration for low-value parts

This is a reasonable production strategy, but the actual performance baseline has not yet been formally benchmarked against the full end-user workload in the live environment.

## 15. Security

The current repository includes:
- password hashing with PBKDF2
- session validation
- permission checks
- audit logging
- protected route enforcement
- example runtime guard tests around first-admin provisioner safety

This is the expected security boundary for the current implementation.

## 16. Future integrations

The design and specification document the eventual extension of the system into a larger Pinnacle operating platform, including support for deeper commercial, finance, and project automation workflows. These future integrations are described in business terms, but the codebase should only be described as being implemented where actual routes, schemas, and services exist.

## 17. Production status

The repository is structurally sound and has verified build/test/runtime health, but the live Pinnacle employee data migration and the final production identity cleanup remain the final remaining business-critical work.
