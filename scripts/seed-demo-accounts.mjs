import crypto from 'node:crypto';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const allowDemoSeed = process.argv.includes('--allow-demo-seed') || process.env.ALLOW_DEMO_SEED === 'true' || process.env.ALLOW_DEMO_SEED === '1';
if (!allowDemoSeed) {
  console.error('Demo seeding is disabled by default for production safety. Re-run with --allow-demo-seed or ALLOW_DEMO_SEED=1 to intentionally create demo data.');
  process.exit(1);
}

const subtle = crypto.webcrypto.subtle;
const PBKDF2_ITERATIONS = 600_000;
const HASH_ALGORITHM = 'SHA-256';
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const encoder = new TextEncoder();

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES);
  const key = await subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', hash: HASH_ALGORITHM, salt: new Uint8Array(salt), iterations: PBKDF2_ITERATIONS },
    key,
    KEY_BYTES * 8
  );
  const hashBytes = new Uint8Array(bits);
  return `pbkdf2$${HASH_ALGORITHM}$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hashBytes)}`;
}

async function run() {
  console.log('--- SEEDING ENTERPRISE OPERATIONAL DATA & ACCOUNTS ---');

  const now = Date.now();

  // Departments & Designations
  const deptOpsId = 'd0000000-0000-4000-8000-000000000001'; // Operations
  const deptExecId = 'd0000000-0000-4000-8000-000000000003'; // Executive
  const desigOpsSpecId = 'e0000000-0000-4000-8000-000000000001'; // Operations Specialist
  const desigOpsMgrId = 'e0000000-0000-4000-8000-000000000002'; // Operations Manager
  const desigCeoId = 'e0000000-0000-4000-8000-000000000003'; // Chief Executive Officer

  // Deterministic passwords
  const adminHash = await hashPassword('Admin#2026!Secure');
  const ceoHash = await hashPassword('Ceo#2026!Secure');
  const mgrHash = await hashPassword('Manager#2026!Secure');
  const empHash = await hashPassword('Employee#2026!Secure');

  // S1000 Admin
  const adminUserId = 'u0000000-0000-4000-8000-000000001000';
  const adminEmpUuid = 'c0000000-0000-4000-8000-000000001000';
  // Also accommodate remote UUID if previously set
  const remoteAdminUserId = 'b41ae6e8-2af3-4dc4-9592-1e18374a3233';
  const remoteAdminEmpUuid = 'a44d42ea-d9fa-4797-8fb7-3ad93a2b5475';

  // S1001 CEO / Business Head
  const ceoUserId = 'u0000000-0000-4000-8000-000000001001';
  const ceoEmpUuid = 'c0000000-0000-4000-8000-000000001001';

  // S1002 Manager
  const mgrUserId = 'u0000000-0000-4000-8000-000000001002';
  const mgrEmpUuid = 'c0000000-0000-4000-8000-000000001002';

  // S1003 Employee
  const empUserId = 'u0000000-0000-4000-8000-000000001003';
  const empEmpUuid = 'c0000000-0000-4000-8000-000000001003';

  // Clients
  const client1Id = 'c1000000-0000-4000-8000-000000000001';
  const client2Id = 'c1000000-0000-4000-8000-000000000002';
  const client3Id = 'c1000000-0000-4000-8000-000000000003';

  // Vendors
  const vendor1Id = 'v1000000-0000-4000-8000-000000000001';
  const vendor2Id = 'v1000000-0000-4000-8000-000000000002';
  const vendor3Id = 'v1000000-0000-4000-8000-000000000003';

  // Projects
  const proj1Id = 'p1000000-0000-4000-8000-000000000001';
  const proj2Id = 'p1000000-0000-4000-8000-000000000002';
  const proj3Id = 'p1000000-0000-4000-8000-000000000003';

  // Invoices & Payments
  const inv1Id = 'i1000000-0000-4000-8000-000000000001';
  const inv2Id = 'i1000000-0000-4000-8000-000000000002';
  const inv3Id = 'i1000000-0000-4000-8000-000000000003';
  const pay1Id = 'py100000-0000-4000-8000-000000000001';
  const pay2Id = 'py100000-0000-4000-8000-000000000002';

  // Tasks
  const task1Id = 't1000000-0000-4000-8000-000000000001';
  const task2Id = 't1000000-0000-4000-8000-000000000002';
  const task3Id = 't1000000-0000-4000-8000-000000000003';
  const task4Id = 't1000000-0000-4000-8000-000000000004';

  const todayMidnight = new Date();
  todayMidnight.setHours(23, 59, 59, 999);
  const dueToday = todayMidnight.getTime();
  const dueTomorrow = dueToday + 86400000;
  const dueNextWeek = dueToday + 7 * 86400000;
  const overdueYesterday = dueToday - 86400000;
  const thirtyDaysAgo = dueToday - 30 * 86400000;
  const twentyDaysAgo = dueToday - 20 * 86400000;
  const fortyFiveDaysAgo = dueToday - 45 * 86400000;
  const tenDaysAgo = dueToday - 10 * 86400000;

  // Delay Request for Task 2
  const delay1Id = 'd1000000-0000-4000-8000-000000000001';

  // Follow-ups for S1003
  const follow1Id = 'f1000000-0000-4000-8000-000000000001';
  const follow2Id = 'f1000000-0000-4000-8000-000000000002';

  // Meetings for S1003
  const meet1Id = 'm1000000-0000-4000-8000-000000000001';
  const meetingTime = new Date();
  meetingTime.setHours(15, 0, 0, 0);

  // Opportunities for S1003
  const opp1Id = 'o1000000-0000-4000-8000-000000000001';
  const opp2Id = 'o1000000-0000-4000-8000-000000000002';

  // Employee Targets for S1003
  const target1Id = 'e1000000-0000-4000-8000-000000000001';

  // Daily Work Reports for S1003
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yestDateStr = yest.toISOString().split('T')[0];
  const report1Id = 'r1000000-0000-4000-8000-000000000001';

  const sql = `-- 1. Ensure Executive & Ops Departments and Designations exist
INSERT INTO departments (id, name, code, is_active, created_at, updated_at) VALUES
('d0000000-0000-4000-8000-000000000001', 'Operations', 'OPS', 1, ${now}, ${now}),
('d0000000-0000-4000-8000-000000000002', 'Technology', 'TECH', 1, ${now}, ${now}),
('${deptExecId}', 'Executive Leadership', 'EXEC', 1, ${now}, ${now})
ON CONFLICT(id) DO UPDATE SET is_active = 1, updated_at = ${now};

INSERT INTO designations (id, department_id, name, code, is_active, created_at, updated_at) VALUES
('${desigOpsSpecId}', '${deptOpsId}', 'Operations Specialist', 'OPS_SPEC', 1, ${now}, ${now}),
('${desigOpsMgrId}', '${deptOpsId}', 'Operations Manager', 'OPS_MGR', 1, ${now}, ${now}),
('${desigCeoId}', '${deptExecId}', 'Chief Executive Officer', 'CEO_DESIG', 1, ${now}, ${now})
ON CONFLICT(id) DO UPDATE SET is_active = 1, updated_at = ${now};

-- Ensure CEO role has company-read and audit permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
('8dc8f112-1c8d-4c70-9cf3-0a250f2f4001', 'a0000000-0000-4000-8000-000000000001'),
('8dc8f112-1c8d-4c70-9cf3-0a250f2f4001', 'a0000000-0000-4000-8000-000000000002'),
('8dc8f112-1c8d-4c70-9cf3-0a250f2f4001', 'a0000000-0000-4000-8000-000000000003'),
('8dc8f112-1c8d-4c70-9cf3-0a250f2f4001', 'a0000000-0000-4000-8000-000000000007');

-- 2. Upsert Admin S1000
INSERT INTO users (id, password_hash, status, created_at, updated_at) VALUES ('${adminUserId}', '${adminHash}', 'ACTIVE', ${now}, ${now})
ON CONFLICT(id) DO UPDATE SET password_hash = '${adminHash}', status = 'ACTIVE', updated_at = ${now};

INSERT INTO employees (id, user_id, employee_id, full_name, mobile, email, department_id, designation_id, is_active, created_at, updated_at)
VALUES ('${adminEmpUuid}', '${adminUserId}', 'S1000', 'System Administrator', '+14155550100', 'admin@pinnacle.com', '${deptOpsId}', '${desigOpsSpecId}', 1, ${now}, ${now})
ON CONFLICT(id) DO UPDATE SET is_active = 1, department_id = '${deptOpsId}', designation_id = '${desigOpsSpecId}', full_name = 'System Administrator', email = 'admin@pinnacle.com', updated_at = ${now};

INSERT OR IGNORE INTO employee_roles (employee_id, role_id, assigned_at) VALUES ('${adminEmpUuid}', '8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', ${now});

-- Support alternate remote admin if present
UPDATE users SET password_hash = '${adminHash}', status = 'ACTIVE', updated_at = ${now} WHERE id = '${remoteAdminUserId}';
INSERT OR IGNORE INTO employee_roles (employee_id, role_id, assigned_at)
SELECT '${remoteAdminEmpUuid}', '8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', ${now}
WHERE EXISTS (SELECT 1 FROM employees WHERE id = '${remoteAdminEmpUuid}');

-- 3. Upsert CEO S1001
INSERT INTO users (id, password_hash, status, created_at, updated_at) VALUES ('${ceoUserId}', '${ceoHash}', 'ACTIVE', ${now}, ${now})
ON CONFLICT(id) DO UPDATE SET password_hash = '${ceoHash}', status = 'ACTIVE', updated_at = ${now};

INSERT INTO employees (id, user_id, employee_id, full_name, mobile, email, department_id, designation_id, is_active, created_at, updated_at)
VALUES ('${ceoEmpUuid}', '${ceoUserId}', 'S1001', 'Siddharth Rao (CEO)', '+14155550101', 'ceo@pinnacle.com', '${deptExecId}', '${desigCeoId}', 1, ${now}, ${now})
ON CONFLICT(id) DO UPDATE SET is_active = 1, department_id = '${deptExecId}', designation_id = '${desigCeoId}', full_name = 'Siddharth Rao (CEO)', email = 'ceo@pinnacle.com', updated_at = ${now};

INSERT OR IGNORE INTO employee_roles (employee_id, role_id, assigned_at) VALUES ('${ceoEmpUuid}', '8dc8f112-1c8d-4c70-9cf3-0a250f2f4001', ${now});

-- 4. Upsert Manager S1002
INSERT INTO users (id, password_hash, status, created_at, updated_at) VALUES ('${mgrUserId}', '${mgrHash}', 'ACTIVE', ${now}, ${now})
ON CONFLICT(id) DO UPDATE SET password_hash = '${mgrHash}', status = 'ACTIVE', updated_at = ${now};

INSERT INTO employees (id, user_id, employee_id, full_name, mobile, email, department_id, designation_id, is_active, created_at, updated_at)
VALUES ('${mgrEmpUuid}', '${mgrUserId}', 'S1002', 'Operations Manager', '+14155550102', 'manager@pinnacle.com', '${deptOpsId}', '${desigOpsMgrId}', 1, ${now}, ${now})
ON CONFLICT(id) DO UPDATE SET is_active = 1, department_id = '${deptOpsId}', designation_id = '${desigOpsMgrId}', full_name = 'Operations Manager', email = 'manager@pinnacle.com', updated_at = ${now};

INSERT OR IGNORE INTO employee_roles (employee_id, role_id, assigned_at) VALUES ('${mgrEmpUuid}', '8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', ${now});

-- 5. Upsert Employee S1003 (Managed by S1002)
INSERT INTO users (id, password_hash, status, created_at, updated_at) VALUES ('${empUserId}', '${empHash}', 'ACTIVE', ${now}, ${now})
ON CONFLICT(id) DO UPDATE SET password_hash = '${empHash}', status = 'ACTIVE', updated_at = ${now};

INSERT INTO employees (id, user_id, employee_id, manager_employee_id, full_name, mobile, email, department_id, designation_id, is_active, created_at, updated_at)
VALUES ('${empEmpUuid}', '${empUserId}', 'S1003', '${mgrEmpUuid}', 'Operations Specialist', '+14155550103', 'employee@pinnacle.com', '${deptOpsId}', '${desigOpsSpecId}', 1, ${now}, ${now})
ON CONFLICT(id) DO UPDATE SET is_active = 1, manager_employee_id = '${mgrEmpUuid}', department_id = '${deptOpsId}', designation_id = '${desigOpsSpecId}', full_name = 'Operations Specialist', email = 'employee@pinnacle.com', updated_at = ${now};

INSERT OR IGNORE INTO employee_roles (employee_id, role_id, assigned_at) VALUES ('${empEmpUuid}', '8dc8f112-1c8d-4c70-9cf3-0a250f2f4004', ${now});

-- 6. Set sequence for next applicant to S1004
INSERT INTO employee_id_sequences (name, next_value, updated_at) VALUES ('EMPLOYEE', 1004, ${now})
ON CONFLICT(name) DO UPDATE SET next_value = MAX(next_value, 1004);

-- 7. Seed Vendors
DELETE FROM vendors WHERE id IN ('${vendor1Id}', '${vendor2Id}', '${vendor3Id}');
INSERT INTO vendors (id, vendor_id, name, category, contact_person, phone, email, location, status, assigned_employee_id, created_at, updated_at) VALUES
('${vendor1Id}', 'V1001', 'Apex Fabrication Labs', 'FABRICATION', 'Ramesh Sharma', '+91-98200-11223', 'ramesh@apexfab.in', 'Mumbai, MH', 'ACTIVE', '${empEmpUuid}', ${now}, ${now}),
('${vendor2Id}', 'V1002', 'Swift Logistics & Transit', 'LOGISTICS', 'Anita Desai', '+91-98200-44556', 'anita@swifttransit.in', 'Bhiwandi, MH', 'ACTIVE', '${empEmpUuid}', ${now}, ${now}),
('${vendor3Id}', 'V1003', 'Aura Sound & Visual Systems', 'EQUIPMENT', 'Vikram Mehta', '+91-98200-77889', 'vikram@aurasound.in', 'Bengaluru, KA', 'ACTIVE', '${mgrEmpUuid}', ${now}, ${now});

-- 8. Clean and Seed CRM Clients
DELETE FROM clients WHERE id IN ('${client1Id}', '${client2Id}', '${client3Id}');
INSERT INTO clients (id, name, company_name, email, phone, status, assigned_employee_id, created_at, updated_at) VALUES
('${client1Id}', 'Marcus Vance', 'Apex Logistics Corp', 'marcus.vance@apexlogistics.com', '+1-555-0191', 'ACTIVE', '${empEmpUuid}', ${now}, ${now}),
('${client2Id}', 'Elena Rostova', 'Zenith Retail Group', 'elena.rostova@zenithretail.com', '+1-555-0192', 'ACTIVE', '${empEmpUuid}', ${now}, ${now}),
('${client3Id}', 'David Sterling', 'Nordic Energy Systems', 'd.sterling@nordicenergy.com', '+1-555-0193', 'ACTIVE', '${mgrEmpUuid}', ${now}, ${now});

-- 9. Seed Projects & Project Milestones
DELETE FROM project_milestones WHERE project_id IN ('${proj1Id}', '${proj2Id}', '${proj3Id}');
DELETE FROM projects WHERE id IN ('${proj1Id}', '${proj2Id}', '${proj3Id}');

INSERT INTO projects (id, project_code, title, client_id, owner_employee_id, vendor_id, status, budget, start_date, target_date, created_at, updated_at) VALUES
('${proj1Id}', 'P-2026-001', 'Apex Global Logistics Expo Pavilion', '${client1Id}', '${empEmpUuid}', '${vendor1Id}', 'DISPATCH', 4500000, ${thirtyDaysAgo}, ${dueNextWeek + 14 * 86400000}, ${now}, ${now}),
('${proj2Id}', 'P-2026-002', 'Zenith Retail Flagship Telematics Concourse', '${client2Id}', '${empEmpUuid}', '${vendor3Id}', 'FABRICATION', 6200000, ${tenDaysAgo}, ${dueNextWeek + 30 * 86400000}, ${now}, ${now}),
('${proj3Id}', 'P-2026-003', 'Nordic Clean Energy Summit Infrastructure', '${client3Id}', '${mgrEmpUuid}', '${vendor2Id}', 'LIVE', 8500000, ${fortyFiveDaysAgo}, ${dueTomorrow}, ${now}, ${now});

-- Milestones for Project 1
INSERT INTO project_milestones (id, project_id, stage, title, status, due_date, created_at, updated_at) VALUES
('pm100000-0000-4000-8000-000000000001', '${proj1Id}', 'FABRICATION', 'Modular Framework & Truss Production', 'COMPLETED', ${tenDaysAgo}, ${now}, ${now}),
('pm100000-0000-4000-8000-000000000002', '${proj1Id}', 'DISPATCH', 'Fleet Loading & Transit to Pragati Maidan', 'IN_PROGRESS', ${dueToday}, ${now}, ${now}),
('pm100000-0000-4000-8000-000000000003', '${proj1Id}', 'SETUP', 'On-site Assembly & AV Rigging', 'PENDING', ${dueTomorrow + 86400000}, ${now}, ${now}),
('pm100000-0000-4000-8000-000000000004', '${proj1Id}', 'LIVE', 'Expo Operations & Telemetry Support', 'PENDING', ${dueTomorrow + 3 * 86400000}, ${now}, ${now}),
('pm100000-0000-4000-8000-000000000005', '${proj1Id}', 'DISMANTLE', 'Safe De-rigging and Return Logistics', 'PENDING', ${dueTomorrow + 5 * 86400000}, ${now}, ${now}),
('pm100000-0000-4000-8000-000000000006', '${proj1Id}', 'CLOSURE_PACK', 'Sign-off Audit & Client Acceptance Dossier', 'PENDING', ${dueTomorrow + 7 * 86400000}, ${now}, ${now});

-- 10. Seed Invoices & Payments
DELETE FROM payments WHERE invoice_id IN ('${inv1Id}', '${inv2Id}', '${inv3Id}');
DELETE FROM invoices WHERE id IN ('${inv1Id}', '${inv2Id}', '${inv3Id}');

INSERT INTO invoices (id, invoice_number, client_id, project_id, amount, status, issue_date, due_date, notes, created_at, updated_at) VALUES
('${inv1Id}', 'INV-2026-001', '${client2Id}', '${proj2Id}', 1250000, 'PAID', ${thirtyDaysAgo}, ${tenDaysAgo}, 'Initial advance mobilization for POS Telematics concourse.', ${now}, ${now}),
('${inv2Id}', 'INV-2026-002', '${client1Id}', '${proj1Id}', 3500000, 'PARTIALLY_PAID', ${fortyFiveDaysAgo}, ${tenDaysAgo}, 'Fabrication completion milestone invoice.', ${now}, ${now}),
('${inv3Id}', 'INV-2026-003', '${client3Id}', '${proj3Id}', 800000, 'ISSUED', ${tenDaysAgo}, ${dueNextWeek}, 'Live summit telematics integration fees.', ${now}, ${now});

INSERT INTO payments (id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at) VALUES
('${pay1Id}', '${inv1Id}', 1250000, ${tenDaysAgo}, 'BANK_TRANSFER', 'NEFT-AXIS-20260901-0987', 'Full settlement received from Zenith Finance.', ${now}),
('${pay2Id}', '${inv2Id}', 2000000, ${twentyDaysAgo}, 'BANK_TRANSFER', 'RTGS-HDFC-20260825-4421', 'First tranche mobilization payment.', ${now});

-- 11. Seed Operational Tasks, Delays, CRM
DELETE FROM task_delay_requests WHERE requested_by_employee_id IN ('${mgrEmpUuid}', '${empEmpUuid}', '${adminEmpUuid}');
DELETE FROM tasks WHERE assigned_to_employee_id IN ('${mgrEmpUuid}', '${empEmpUuid}', '${adminEmpUuid}') OR assigned_by_employee_id IN ('${mgrEmpUuid}', '${empEmpUuid}', '${adminEmpUuid}');
DELETE FROM follow_ups WHERE employee_id IN ('${mgrEmpUuid}', '${empEmpUuid}', '${adminEmpUuid}');
DELETE FROM meetings WHERE employee_id IN ('${mgrEmpUuid}', '${empEmpUuid}', '${adminEmpUuid}');
DELETE FROM opportunities WHERE owner_employee_id IN ('${mgrEmpUuid}', '${empEmpUuid}', '${adminEmpUuid}');
DELETE FROM daily_work_reports WHERE employee_id IN ('${mgrEmpUuid}', '${empEmpUuid}', '${adminEmpUuid}');
DELETE FROM employee_targets WHERE employee_id IN ('${mgrEmpUuid}', '${empEmpUuid}', '${adminEmpUuid}');

-- Tasks
INSERT INTO tasks (id, title, description, assigned_to_employee_id, assigned_by_employee_id, client_id, priority, status, original_due_date, current_due_date, created_at, updated_at) VALUES
('${task1Id}', 'Dispatch Q3 Vendor Compliance Audit Checklist', 'Send formal verification and warehouse security compliance checklist to Marcus Vance.', '${empEmpUuid}', '${mgrEmpUuid}', '${client1Id}', 'P1', 'TODO', ${dueToday}, ${dueToday}, ${now}, ${now}),
('${task2Id}', 'Zenith Retail POS Telematics Integration Scope', 'Gather API payload requirements and webhook callbacks from client engineering lead.', '${empEmpUuid}', '${mgrEmpUuid}', '${client2Id}', 'P2', 'IN_PROGRESS', ${dueTomorrow}, ${dueTomorrow}, ${now}, ${now}),
('${task3Id}', 'Nordic Energy Monthly Ops Reconciliation', 'Verify all 42 warehouse receipt manifests against cross-dock consignment records.', '${empEmpUuid}', '${mgrEmpUuid}', '${client3Id}', 'P2', 'PENDING_VERIFICATION', ${overdueYesterday}, ${overdueYesterday}, ${now}, ${now}),
('${task4Id}', 'Q3 Regional Ops Staffing & Capacity Review', 'Prepare team utilization report and projected headcount requirements for Q4.', '${mgrEmpUuid}', '${adminEmpUuid}', NULL, 'P1', 'IN_PROGRESS', ${dueNextWeek}, ${dueNextWeek}, ${now}, ${now});

UPDATE tasks SET evidence = 'https://docs.pinnacle.internal/ops/nordic-reconciliation-aug26.pdf', evidence_type = 'LINK', maker_notes = 'Reconciled all 42 purchase orders with warehouse manifests. Discrepancies resolved. Awaiting manager sign-off.' WHERE id = '${task3Id}';

-- Delay Request for Task 2
INSERT INTO task_delay_requests (id, task_id, requested_by_employee_id, original_due_date, requested_due_date, reason, business_impact, status, created_at, updated_at) VALUES
('${delay1Id}', '${task2Id}', '${empEmpUuid}', ${dueTomorrow}, ${dueTomorrow + 172800000}, 'Client IT Director out of office until Thursday; awaiting webhook endpoint specifications.', 'Technical scoping milestone shifted by 2 business days; no impact on final delivery schedule.', 'PENDING', ${now}, ${now});

-- Follow-ups for S1003
INSERT INTO follow_ups (id, client_id, employee_id, date, type, status, outcome, next_action, next_follow_up_date, notes, created_at, updated_at) VALUES
('${follow1Id}', '${client1Id}', '${empEmpUuid}', ${dueToday - 3600000}, 'CALL', 'UPCOMING', NULL, 'Review signed delivery SLAs and resolve demurrage waiver request', ${dueTomorrow}, 'Marcus requested quick alignment call on customs demurrage line items.', ${now}, ${now}),
('${follow2Id}', '${client2Id}', '${empEmpUuid}', ${dueTomorrow}, 'EMAIL', 'UPCOMING', NULL, 'Send revised implementation roadmap', NULL, 'Provide updated sprint estimates once API spec is received.', ${now}, ${now});

-- Meetings for S1003
INSERT INTO meetings (id, client_id, employee_id, title, scheduled_at, status, notes, outcome, next_action, created_at, updated_at) VALUES
('${meet1Id}', '${client1Id}', '${empEmpUuid}', 'Quarterly Service Review - Apex Operations', ${meetingTime.getTime()}, 'SCHEDULED', 'Review Q2 metrics, container dwell times, and Q3 expansion.', NULL, 'Finalize minutes of meeting within 24h', ${now}, ${now});

-- Opportunities for S1003
INSERT INTO opportunities (id, client_id, owner_employee_id, title, stage, estimated_value, probability, expected_close_date, next_action, status, created_at, updated_at) VALUES
('${opp1Id}', '${client2Id}', '${empEmpUuid}', 'Enterprise Fleet Route Optimization System', 'PROPOSAL', 1250000, 70, ${dueNextWeek + 864000000}, 'Deliver security architecture questionnaire', 'ACTIVE', ${now}, ${now}),
('${opp2Id}', '${client3Id}', '${empEmpUuid}', 'Automated Dispatch Telematics Integration', 'OPPORTUNITY', 800000, 40, ${dueNextWeek + 14 * 86400000}, 'Technical discovery call with VP Ops', 'ACTIVE', ${now}, ${now});

-- Employee Targets for S1003
INSERT INTO employee_targets (id, employee_id, period_type, period_start, period_end, target_amount, achieved_amount, target_calls, target_meetings, target_deals, created_at, updated_at) VALUES
('${target1Id}', '${empEmpUuid}', 'MONTHLY', '2026-09-01', '2026-09-30', 2000000, 850000, 60, 15, 3, ${now}, ${now});

-- Daily Work Reports for S1003
INSERT INTO daily_work_reports (id, employee_id, report_date, status, calls_count, meetings_count, follow_ups_count, deals_summary, completed_tasks_summary, pending_tasks_summary, notes, submitted_at, reviewed_by_employee_id, reviewed_at, created_at, updated_at) VALUES
('${report1Id}', '${empEmpUuid}', '${yestDateStr}', 'APPROVED', 8, 2, 4, 'Progressed Zenith proposal to stage 2', 'Completed warehouse audit documentation for Nordic Energy', 'Awaiting Apex customs clearance release', 'Steady progress across all assigned accounts.', ${yest.getTime()}, '${mgrEmpUuid}', ${now}, ${now}, ${now});
`;

  fs.writeFileSync('scripts/seed.sql', sql, 'utf-8');
  console.log('Written scripts/seed.sql');

  console.log('Executing seed against local D1...');
  try {
    const localOut = execSync('npx wrangler d1 execute poc-operation-db --local --file=scripts/seed.sql', { encoding: 'utf-8' });
    console.log(localOut);
  } catch (e) {
    console.error('Local D1 seed failed:', e.message);
    if (e.stdout) console.log(e.stdout);
    if (e.stderr) console.error(e.stderr);
    throw e;
  }

  console.log('Executing seed against remote D1 (optional)...');
  try {
    const remoteOut = execSync('npx wrangler d1 execute poc-operation-db --remote --file=scripts/seed.sql', { encoding: 'utf-8' });
    console.log(remoteOut);
  } catch (e) {
    console.log('Remote D1 seed skipped or failed (network/auth):', e.message);
  }

  console.log('✅ Enterprise Operational Data & Demo Accounts Provisioned:');
  console.log('  Admin:    S1000 / admin@pinnacle.com    / Admin#2026!Secure    (Role: ADMIN)');
  console.log('  CEO:      S1001 / ceo@pinnacle.com      / Ceo#2026!Secure      (Role: CEO)');
  console.log('  Manager:  S1002 / manager@pinnacle.com  / Manager#2026!Secure  (Role: MANAGER)');
  console.log('  Employee: S1003 / employee@pinnacle.com / Employee#2026!Secure (Role: EMPLOYEE)');
}

run().catch((err) => {
  console.error('Seed execution failed:', err.message);
  process.exit(1);
});

