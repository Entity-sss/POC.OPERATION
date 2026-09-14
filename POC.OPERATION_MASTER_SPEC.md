# POC.OPERATION — MASTER PRODUCT & ENGINEERING SPECIFICATION

**Status:** Master source of truth  
**Project:** POC.OPERATION  
**Company:** Pinnacle  
**Stack:** Astro SSR + React + TypeScript + Tailwind + Cloudflare Workers + D1 + R2 + Drizzle + Zod  
**Repository:** https://github.com/Entity-sss/POC.OPERATION

---

## 1. PURPOSE

POC.OPERATION is a company-wide internal operations and business operating platform.

It is NOT merely an employee task manager, CRM, dashboard, HR system, or project tracker.

The long-term system connects:

**Employees → Managers → Admin/Host → CEO/Business Head → Clients → Vendors → Tasks → Targets → Follow-ups → Meetings → Opportunities → Deals → Projects → Operations → Finance → Reports → Approvals → Company Analytics**

The core business chain is:

**Activity → Opportunity → Proposal → Conversion → Project → Execution → Invoice → Collection → Revenue/Profit**

The application must be built as one connected system. Do not create disconnected mock pages.

---

# 2. NON-NEGOTIABLE ENGINEERING RULES

1. Use the existing Astro + Cloudflare architecture. Do not migrate to Next.js or another framework unless explicitly approved.
2. Do not rebuild the already-completed technical foundation.
3. Do not build fake/static workflows. UI actions must connect to real backend state and persistence.
4. Server-side authorization is mandatory. Hiding UI controls is not authorization.
5. Use granular RBAC: roles + permissions + data scope + employee overrides.
6. Business logic belongs in server/service/domain layers, not only in React/Astro components.
7. Validate user input server-side with Zod.
8. Use Drizzle for database access and migrations.
9. Use stable IDs and foreign keys.
10. Never overwrite immutable business history.
11. Original task deadlines must remain immutable.
12. Maker and checker must not be the same person for controlled workflows.
13. Sensitive documents must never be publicly accessible.
14. Never store passwords in plaintext.
15. Never commit secrets or sensitive data.
16. Never log passwords, Aadhaar/PAN values, session secrets, document contents, or equivalent sensitive data.
17. Do not hardcode business metrics that should be calculated from database records.
18. Do not duplicate master data.
19. Formal approvals must remain formal approval workflows and must not be bypassed through chat.
20. Do not introduce Cloudflare KV, Queues, Durable Objects, Cron, or other infrastructure unless a real requirement needs it.
21. Do not make destructive database changes casually.
22. Before substantial coding, inspect the existing repository and relevant implementation.
23. Work on the requested phase; do not silently implement unrelated phases.
24. Before completing a feature, run typecheck/build/migration validation and relevant tests.
25. Do not commit or push unless explicitly instructed.

---

# 3. BUSINESS MODEL

The operating model is revenue-first and is designed around a ₹4 crore annual target.

| Revenue Area | Target | Share |
|---|---:|---:|
| Existing Client Revenue Pod | ₹2.25 crore | 56.25% |
| Growth Revenue Pod | ₹1.50 crore | 37.50% |
| Strategic Opportunity Pool | ₹25 lakh | 6.25% |
| Total | ₹4 crore | 100% |

These values are business configuration/data, not UI constants.

## Shared operating structure

- Revenue Pods own client/commercial relationships.
- Operations owns execution.
- Creative is a shared service.
- Finance owns invoicing, collections and financial tracking.
- Business Head owns targets, final approvals, escalations, resource allocation and strategic opportunity pool.

---

# 4. ROLES

Initial roles:

1. CEO / Business Head
2. Admin / Host
3. Manager / Revenue Lead
4. Employee / Revenue Pod Member
5. Intern
6. Operations
7. Finance

Creative may become a dedicated role/department later.

## CEO / Business Head

Business authority:

- company-wide business visibility
- revenue targets
- strategic opportunities
- final approvals
- escalations
- resource allocation
- critical delay decisions
- company performance
- pipeline/revenue oversight
- major risks

CEO and Admin are intentionally different.

## Admin / Host

System authority:

- employee management
- registration approvals
- roles and permissions
- departments/designations
- clients
- tasks
- targets
- reports
- authorized document management
- notifications
- audit logs
- settings
- impersonation / Access as Employee

Admin does not automatically receive CEO/business authority.

## Manager / Revenue Lead

Management authority within assigned scope:

- team
- tasks
- targets
- progress
- employee activity
- clients
- opportunities
- follow-ups
- meetings
- daily report review
- pending verification
- SLA/overdue work
- team performance

Manager permissions must be configurable.

## Employee / Revenue Pod Member

- daily activities
- calls
- meetings
- follow-ups
- clients
- opportunities
- proposals
- tasks
- targets
- daily reports
- project-related work within scope

## Intern

Restricted employee-like access according to assigned permissions.

## Operations

Project execution and operational milestones.

## Finance

- invoices
- payments
- outstanding
- collections
- ageing
- collection follow-ups

---

# 5. IDENTITY

Identity model:

**User → Employee → Role → Department → Designation → Permissions**

## Internal UUID

Every user has an immutable internal UUID.

## Employee ID

Every employee has a permanent human-readable ID.

Examples:

- S1001
- S1002
- ADMIN1001

Employee IDs:

- must be unique
- must never be reused
- are separate from UUIDs
- should be generated by the system

---

# 6. REGISTRATION & AUTHENTICATION

## Existing employee login

Login using:

- Employee ID
- password / secure access code

Required:

- secure password hashing
- server-side sessions
- secure cookies
- login/logout
- current-user endpoint
- protected routes
- unauthorized handling
- authentication rate limiting

## New employee registration

Flow:

**NEW REGISTRATION → PENDING ADMIN REVIEW → APPROVED / REJECTED → ACTIVE**

Rejected registrations retain their history.

Registration fields:

- Full name
- Mobile
- Email
- DOB
- Current address
- Permanent address
- Current education
- Past work/study elaboration
- Previous work experience/joining information

## Documents

Secure document section:

- Aadhaar front
- Aadhaar back
- Aadhaar number
- PAN card
- PAN number
- professional passport-size photo

Production architecture:

- binary files in private Cloudflare R2
- metadata/reference in D1
- no public document URLs
- permission-controlled access
- sensitive document access auditable

Prototype may use dummy data.

---

# 7. RBAC & DATA SCOPE

Required foundation:

- roles
- permissions
- role_permissions
- employee_permission_overrides

Authorization must support both:

1. allowed action
2. allowed data scope

Example permissions:

- employee.read.self
- employee.read.team
- employee.read.company
- employee.update
- employee.approve_registration
- role.manage
- permission.manage
- task.create
- task.assign
- task.verify
- report.submit
- report.review
- report.approve
- opportunity.read
- opportunity.manage
- finance.read
- audit.read
- impersonation.use

Exact names may evolve.

Typical scope:

- Employee → own/assigned records
- Manager → own team
- Admin → broad system control
- CEO → company-wide business scope

---

# 8. ADMIN IMPERSONATION

Admin can securely use the application as an employee for support/troubleshooting.

Never use the employee password.

Impersonation session should record:

- performed_by
- target employee
- timestamp
- reason where required
- session state

UI must show a persistent impersonation banner.

Every impersonation event must be audited.

---

# 9. DATABASE DOMAIN

Recommended initial entities:

```text
users
employees
departments
designations
roles
permissions
role_permissions
employee_permission_overrides
employee_registration_requests
employee_documents

clients
employee_clients

opportunities
opportunity_activities
deals

followups
meetings

tasks
task_history
delay_requests

daily_activities
daily_reports

targets
target_progress

projects
project_members
project_milestones
operations

vendors

invoices
payments
collections

approvals
notifications

tickets
ticket_comments

issues

audit_logs
system_settings
automation_settings
```

Use normalized relationships, foreign keys, unique constraints and appropriate indexes.

---

# 10. CLIENTS

Client master supports:

- Client ID
- name/company name
- phone
- email
- address
- status
- timestamps
- assigned employees/team

Employee-client relationship is many-to-many through:

`employee_clients`

Client master must remain the source of truth.

---

# 11. OPPORTUNITIES / DEALS

Revenue chain:

**Activity → Opportunity → Proposal → Conversion → Project → Execution → Invoice → Collection → Revenue/Profit**

Opportunity supports:

- Opportunity ID
- client
- owner
- revenue pod
- stage
- value
- probability
- next action
- next action date
- evidence/reference
- expected close
- status
- timestamps

Revenue classifications:

- EXISTING_CLIENT
- GROWTH
- STRATEGIC_POOL

Pipeline metrics must come from real records.

---

# 12. FOLLOW-UPS

Fields:

- Follow-up ID
- client
- employee
- date
- type
- outcome
- next follow-up date
- notes
- status

Statuses:

- UPCOMING
- COMPLETED
- OVERDUE
- CANCELLED

---

# 13. MEETINGS

Support:

- meeting ID
- client
- employee
- date/time
- type
- status
- notes
- outcome
- next action
- timestamps

---

# 14. TASKS

Central task entity supports:

- Task ID
- title
- description
- assigned_by
- assigned_to
- priority
- status
- original due date
- revised/current due date
- evidence
- timestamps
- client
- opportunity
- project
- maker
- checker

## Priority

Business priority:

- P1 — immediate
- P2 — important
- P3 — planned

## Status

- TODO
- IN_PROGRESS
- COMPLETED
- OVERDUE
- CANCELLED

## Maker–Checker

**Maker performs/updates → Checker verifies**

Checker verifies:

- completeness
- accuracy
- deadline
- evidence

Maker cannot self-approve controlled work.

---

# 15. EVIDENCE

Evidence types include:

- email link
- proposal link
- purchase order
- work order
- closure pack
- invoice
- message/call note
- remarks

Evidence must be connected to the relevant business record.

---

# 16. DEADLINES & DELAYS

`original_due_date` is immutable.

Delay requests must preserve the original date and contain:

- original due date
- reason
- progress %
- business impact
- recovery action
- requested revised date
- approval status
- approver remarks

Business Head can:

- approve
- reject
- request recovery
- reassign
- escalate to P1

Complete deadline history must be preserved.

---

# 17. SLA

Statuses:

- ON_TRACK
- WATCH
- AT_RISK
- CRITICAL
- OVERDUE

Reference thresholds:

- 95%+ → ON_TRACK
- 85–94% → WATCH
- 70–84% → AT_RISK
- below 70% → CRITICAL

Thresholds should be configurable.

SLA must be calculated from actual workflow/task data.

---

# 18. DAILY ACTIVITIES & REPORTS

Daily activities include:

- calls
- meetings
- briefs
- proposals
- follow-ups
- revenue booked
- completed tasks
- pending tasks
- notes/summary
- evidence

Daily report flow:

**DRAFT → SUBMITTED → MANAGER_REVIEW → APPROVED**

Alternative:

**REJECTED → correction → resubmit**

Rejection requires a reason.

Employee cannot approve their own report.

Approval history must be retained.

---

# 19. TARGETS & KPIs

Targets:

- weekly
- monthly

Metrics:

- sales
- calls
- meetings
- follow-ups
- deals

Example:

Target = ₹5,00,000  
Achievement = ₹3,20,000  
Achievement = 64%

Calculate percentages from authoritative values.

KPI layers:

### Activity
Calls, meetings, follow-ups, briefs, proposals.

### Opportunity
Pipeline, opportunities, proposal value, expected conversion.

### Outcome
Conversions, projects, invoices, collections, revenue/profit.

---

# 20. WEEKLY REVENUE RHYTHM

Reference operating rhythm:

- Monday — planning
- Tuesday — outreach
- Wednesday — proposal
- Thursday — conversion
- Friday — review/recovery

Use this for reporting/automation where relevant.

---

# 21. PROJECTS & OPERATIONS

Projects normally begin after PO or written confirmation.

Project lifecycle can include:

- vendor
- fabrication
- dispatch
- setup
- live
- dismantle
- closure pack

Projects support:

- client
- opportunity/deal
- members
- milestones
- operations
- finance relationships

Operations is a distinct execution layer.

Do not force all operational milestones into generic tasks.

---

# 22. VENDORS

Vendor records:

- Vendor ID
- name
- category
- contact person
- phone
- email
- location
- status
- assigned employee
- active jobs

---

# 23. FINANCE

Finance chain:

**PO → Invoice → Payment → Outstanding → Collection**

Support:

- invoices
- payments
- outstanding
- collection follow-ups
- ageing
- collection status

Connect finance records to relevant client/project/deal records.

---

# 24. EMPLOYEE WORKSPACE

Sections:

- Overview
- Tasks
- Weekly/monthly targets
- Clients
- Follow-ups
- Meetings
- Deals / Opportunities
- Daily Work Report
- Progress
- Notifications
- Profile

Only authorized records may be shown.

---

# 25. MANAGER WORKSPACE

Sections/capabilities:

- team overview
- tasks
- targets
- progress
- employee activity
- clients
- follow-ups
- meetings
- opportunities
- deals
- daily reports awaiting review
- pending verification
- SLA
- overdue work
- team performance

All metrics must be database-driven.

---

# 26. ADMIN CONTROL CENTER

Capabilities:

- employee management
- registration approvals
- roles
- permissions
- permission overrides
- departments
- designations
- profiles
- documents where authorized
- clients
- tasks
- targets
- reports
- notifications
- audit logs
- settings
- impersonation

All sensitive modifications must be audited.

---

# 27. CEO COMMAND CENTER

Company-wide business dashboard:

- executive overview
- company health
- revenue
- target vs achievement
- pipeline
- conversion
- major risks
- pending approvals
- critical overdue work
- people
- managers
- team performance
- opportunity pipeline
- projects/operations
- clients
- finance/collections
- SLA/risk
- issue register
- authorized audit/activity visibility

Drill-down:

**Company → Department → Manager → Employee → Client → Opportunity → Project → Task/Activity**

---

# 28. NOTIFICATIONS

Persist notifications where required.

Potential events:

- task assignment
- approaching deadline
- overdue work
- report submission/review/rejection/approval
- delay request/decision
- registration decision
- follow-up reminder
- meeting reminder
- ticket updates
- escalation
- security/permission event

---

# 29. CHAT, TICKETS & ISSUES

## Chat

For communication/help/clarification.

## Tickets

Formal issue/support workflow:

Fields:

- Ticket ID
- title
- description
- category
- priority
- created_by
- assigned_to
- status
- comments
- timestamps

Statuses:

- OPEN
- IN_PROGRESS
- WAITING
- RESOLVED
- CLOSED

Chat must not bypass formal approvals.

## Issue register

Track:

- issue
- category
- owner
- priority
- status
- resolution
- timestamps

Issue register is distinct from ordinary chat.

---

# 30. AUDIT LOGGING

Central entity:

`audit_logs`

Recommended fields:

- timestamp
- performed_by
- target_user
- action
- module/entity
- record ID
- old value/status
- new value/status
- description
- request/IP metadata where appropriate

Audit at minimum:

- role changes
- permission changes
- employee modifications
- registration decisions
- impersonation
- approvals/rejections
- task changes
- deadline changes
- document access where appropriate
- financial changes
- security-sensitive actions

Never store secrets or document contents in audit logs.

---

# 31. SECURITY

Required production direction:

- secure password hashing
- secure server-side sessions
- secure cookies
- HttpOnly/Secure/SameSite where applicable
- server-side authorization
- Zod input validation
- CSRF protection where applicable
- authentication/API rate limiting
- safe error responses
- Cloudflare secrets/environment variables
- private R2
- no public sensitive documents
- no sensitive logs
- audit logging
- least privilege
- secure impersonation
- data-scope enforcement

---

# 32. TECHNOLOGY

The existing stack is:

### Frontend
- Astro 7
- React 19
- TypeScript
- Tailwind CSS v4

### Backend
- Astro SSR
- Cloudflare Workers
- Astro server endpoints / REST-style APIs

### Database
- Cloudflare D1
- Drizzle ORM
- Drizzle Kit

### Validation
- Zod

### Storage
- Cloudflare R2

### Source control
- Git + GitHub

Do not migrate frameworks without explicit approval.

---

# 33. CLOUDflare FOUNDATION

Current Worker:

`poc-operation`

Current D1:

`poc-operation-db`

D1 binding:

`poc_operation_db`

Current architecture uses Astro's Cloudflare server entrypoint.

R2 is the planned private object-storage layer for documents/objects.

Do not add additional Cloudflare infrastructure unless needed by an actual feature.

---

# 34. CURRENT REPOSITORY FOUNDATION

Already established:

```text
src/
  components/
  layouts/
  pages/
    api/
  lib/
    auth/
    db/
    permissions/
    services/
    validation/
    utils/
  styles/

drizzle/
astro.config.mjs
wrangler.jsonc
drizzle.config.ts
package.json
tsconfig.json
worker-configuration.d.ts
```

Existing endpoint:

`GET /api/health`

The starter UI is temporary and should eventually be replaced by the actual application.

Do not recreate the technical foundation.

---

# 35. DEVELOPMENT ROADMAP

## Phase 1 — Technical Foundation
**COMPLETE**

Astro, React, TypeScript, Tailwind, Cloudflare Workers, D1, Drizzle, Zod, Git/GitHub, structure and health endpoint.

## Phase 2 — Identity & Authentication
Implement:

- identity schema
- employee schema
- departments/designations
- roles/permissions
- registration requests
- secure password hashing
- login/logout
- server sessions
- protected routes
- current user
- employee ID generation
- registration approval/rejection
- audit/security events

## Phase 3 — Admin
Implement employee administration, permissions, documents, impersonation, audit and system controls.

## Phase 4 — Employee
Implement employee workspace and daily operational workflow.

## Phase 5 — Manager
Implement team management, review, SLA, performance and verification.

## Phase 6 — Revenue / CRM
Implement clients, employee-client assignments, opportunities, pipeline, proposals, conversions and deals.

## Phase 7 — Governance
Implement Maker–Checker, evidence, deadlines, delay approvals, SLA, escalation, daily reports and KPI/target logic.

## Phase 8 — Projects / Operations
Implement projects, milestones, operations and execution workflow.

## Phase 9 — Finance / Vendors
Implement vendors, invoices, payments, collections and ageing.

## Phase 10 — CEO
Implement executive command center, company health, revenue, pipeline, risks and drill-down analytics.

## Phase 11 — Communication
Implement notifications, tickets, issue register and chat/help.

## Phase 12 — Production Hardening
Security, tests, authorization audit, session review, R2 privacy, rate limiting, CI/CD, deployment, observability, performance and recovery.

---

# 36. AGENT PROTOCOL

Every coding agent must:

### Before coding
1. Read this document.
2. Inspect repository structure.
3. Inspect Git status.
4. Inspect relevant existing implementation.
5. Determine whether the capability already exists.
6. Identify database/migration impact.
7. Plan the smallest correct implementation.

### During coding
1. Implement the requested phase only.
2. Reuse existing architecture.
3. Avoid duplicate helpers/entities.
4. Keep authorization server-side.
5. Keep database state authoritative.
6. Keep UI synchronized with backend state.
7. Preserve future compatibility.
8. Add migrations for schema changes.
9. Add tests for important business logic.

### After coding
Run relevant checks, including:

```text
npm install
npm run generate-types
npm run typecheck
npm run build
npm run db:generate
```

Also run relevant tests.

Report:

- files changed
- database changes
- APIs added
- workflows added
- authorization changes
- tests/validation
- migration status
- known issues
- architectural decisions affecting future phases

Do not commit/push unless explicitly instructed.

---

# 37. DEFINITION OF DONE

A feature is not complete because its UI renders.

Where applicable, completion requires:

- UI
- API
- validation
- authorization
- database persistence
- loading states
- error states
- success states
- correct workflow transitions
- data-scope enforcement
- audit events
- migration
- TypeScript success
- build success
- relevant tests

---

# 38. SOURCE-OF-TRUTH BUSINESS RULES

The Pinnacle operating material establishes:

- revenue-first operating model
- ₹4 crore annual target
- Existing Client / Growth / Strategic revenue structure
- shared services
- P1/P2/P3 priorities
- Maker–Checker governance
- evidence discipline
- SLA management
- delay approval
- weekly revenue rhythm
- Activity / Opportunity / Outcome KPI layers
- review cadence
- stable IDs
- master-data rules
- issue register
- role-specific operating responsibilities

The application should convert these operating rules into connected software workflows rather than merely reproducing spreadsheet screens.

---

# 39. MASTER-DATA RULE

Master data must have a single source of truth.

Important masters include:

- Employee Master
- Client Master
- Vendor Master
- Project Master
- Opportunity Pipeline
- Task records
- Finance records

Do not maintain conflicting duplicate records.

---

# 40. UI / UX PRINCIPLES

The application should be:

- professional
- modern
- clean
- fast
- responsive
- accessible
- information-dense where useful
- role-aware
- clear about business status

Useful states:

- loading
- empty
- error
- success
- pending approval
- overdue
- risk
- SLA
- verification
- revenue status

Do not create decorative UI that has no operational purpose.

Charts and metrics must represent real data.

---

# 41. FUTURE EXTENSIBILITY

Possible later integrations:

- email
- calendars
- messaging
- external CRM
- accounting systems
- analytics
- AI assistance
- automated reminders
- scheduled jobs
- queues
- client/vendor portals

Do not build infrastructure for these until the requirement exists.

---

# 42. CURRENT STATE & NEXT STEP

The technical foundation is complete.

Current state includes:

- Astro SSR
- React
- TypeScript
- Tailwind
- Cloudflare Workers
- D1
- Drizzle
- Zod
- Git/GitHub
- project structure
- health API
- synchronized repository

The next implementation phase is:

**IDENTITY + AUTHENTICATION**

The database schema required for authentication is part of implementing this phase; it is NOT a reason to restart the technical foundation.

---

# 43. FINAL AGENT DIRECTIVE

Treat this file as the long-term product and engineering contract for POC.OPERATION.

POC.OPERATION must evolve as **one connected system**, not as a sequence of unrelated screens.

Before implementing any new feature:

**Read this specification → inspect existing code → understand dependencies → implement the feature as a real vertical slice → validate it → preserve future compatibility.**

If an implementation decision conflicts with this specification, stop and report the conflict instead of silently changing the architecture.

