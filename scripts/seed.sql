-- 1. Ensure Executive & Ops Departments and Designations exist
INSERT INTO departments (id, name, code, is_active, created_at, updated_at) VALUES
('d0000000-0000-4000-8000-000000000001', 'Operations', 'OPS', 1, 1789517412880, 1789517412880),
('d0000000-0000-4000-8000-000000000002', 'Technology', 'TECH', 1, 1789517412880, 1789517412880),
('d0000000-0000-4000-8000-000000000003', 'Executive Leadership', 'EXEC', 1, 1789517412880, 1789517412880)
ON CONFLICT(id) DO UPDATE SET is_active = 1, updated_at = 1789517412880;

INSERT INTO designations (id, department_id, name, code, is_active, created_at, updated_at) VALUES
('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Operations Specialist', 'OPS_SPEC', 1, 1789517412880, 1789517412880),
('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'Operations Manager', 'OPS_MGR', 1, 1789517412880, 1789517412880),
('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003', 'Chief Executive Officer', 'CEO_DESIG', 1, 1789517412880, 1789517412880)
ON CONFLICT(id) DO UPDATE SET is_active = 1, updated_at = 1789517412880;

-- Ensure CEO role has company-read and audit permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
('8dc8f112-1c8d-4c70-9cf3-0a250f2f4001', 'a0000000-0000-4000-8000-000000000001'),
('8dc8f112-1c8d-4c70-9cf3-0a250f2f4001', 'a0000000-0000-4000-8000-000000000002'),
('8dc8f112-1c8d-4c70-9cf3-0a250f2f4001', 'a0000000-0000-4000-8000-000000000003'),
('8dc8f112-1c8d-4c70-9cf3-0a250f2f4001', 'a0000000-0000-4000-8000-000000000007');

-- 2. Upsert Admin S1000
INSERT INTO users (id, password_hash, status, created_at, updated_at) VALUES ('u0000000-0000-4000-8000-000000001000', 'pbkdf2$SHA-256$600000$rP4qMFszVl8cASYBK2ywMA==$Vx7dnBvJxwrJKH8MFqYJ+lGhYAkVSjWikf1+xTVexHE=', 'ACTIVE', 1789517412880, 1789517412880)
ON CONFLICT(id) DO UPDATE SET password_hash = 'pbkdf2$SHA-256$600000$rP4qMFszVl8cASYBK2ywMA==$Vx7dnBvJxwrJKH8MFqYJ+lGhYAkVSjWikf1+xTVexHE=', status = 'ACTIVE', updated_at = 1789517412880;

INSERT INTO employees (id, user_id, employee_id, full_name, mobile, email, department_id, designation_id, is_active, created_at, updated_at)
VALUES ('c0000000-0000-4000-8000-000000001000', 'u0000000-0000-4000-8000-000000001000', 'S1000', 'System Administrator', '+14155550100', 'admin@pinnacle.com', 'd0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 1, 1789517412880, 1789517412880)
ON CONFLICT(id) DO UPDATE SET is_active = 1, department_id = 'd0000000-0000-4000-8000-000000000001', designation_id = 'e0000000-0000-4000-8000-000000000001', full_name = 'System Administrator', email = 'admin@pinnacle.com', updated_at = 1789517412880;

INSERT OR IGNORE INTO employee_roles (employee_id, role_id, assigned_at) VALUES ('c0000000-0000-4000-8000-000000001000', '8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 1789517412880);

-- Support alternate remote admin if present
UPDATE users SET password_hash = 'pbkdf2$SHA-256$600000$rP4qMFszVl8cASYBK2ywMA==$Vx7dnBvJxwrJKH8MFqYJ+lGhYAkVSjWikf1+xTVexHE=', status = 'ACTIVE', updated_at = 1789517412880 WHERE id = 'b41ae6e8-2af3-4dc4-9592-1e18374a3233';
INSERT OR IGNORE INTO employee_roles (employee_id, role_id, assigned_at)
SELECT 'a44d42ea-d9fa-4797-8fb7-3ad93a2b5475', '8dc8f112-1c8d-4c70-9cf3-0a250f2f4002', 1789517412880
WHERE EXISTS (SELECT 1 FROM employees WHERE id = 'a44d42ea-d9fa-4797-8fb7-3ad93a2b5475');

-- 3. Upsert CEO S1001
INSERT INTO users (id, password_hash, status, created_at, updated_at) VALUES ('u0000000-0000-4000-8000-000000001001', 'pbkdf2$SHA-256$600000$dVTnhE+2cVIhji3bCYb95w==$eQFRM+uHQhC4WldUzeKH90Cg8ky9SNEjZc9/zybqxpo=', 'ACTIVE', 1789517412880, 1789517412880)
ON CONFLICT(id) DO UPDATE SET password_hash = 'pbkdf2$SHA-256$600000$dVTnhE+2cVIhji3bCYb95w==$eQFRM+uHQhC4WldUzeKH90Cg8ky9SNEjZc9/zybqxpo=', status = 'ACTIVE', updated_at = 1789517412880;

INSERT INTO employees (id, user_id, employee_id, full_name, mobile, email, department_id, designation_id, is_active, created_at, updated_at)
VALUES ('c0000000-0000-4000-8000-000000001001', 'u0000000-0000-4000-8000-000000001001', 'S1001', 'Siddharth Rao (CEO)', '+14155550101', 'ceo@pinnacle.com', 'd0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000003', 1, 1789517412880, 1789517412880)
ON CONFLICT(id) DO UPDATE SET is_active = 1, department_id = 'd0000000-0000-4000-8000-000000000003', designation_id = 'e0000000-0000-4000-8000-000000000003', full_name = 'Siddharth Rao (CEO)', email = 'ceo@pinnacle.com', updated_at = 1789517412880;

INSERT OR IGNORE INTO employee_roles (employee_id, role_id, assigned_at) VALUES ('c0000000-0000-4000-8000-000000001001', '8dc8f112-1c8d-4c70-9cf3-0a250f2f4001', 1789517412880);

-- 4. Upsert Manager S1002
INSERT INTO users (id, password_hash, status, created_at, updated_at) VALUES ('u0000000-0000-4000-8000-000000001002', 'pbkdf2$SHA-256$600000$lYlLFQqq0apoDNW9V3G0/Q==$bwBNl8IH/qhrvBGThBLz1XdWTgSdyPLnmhYb3j5MOOk=', 'ACTIVE', 1789517412880, 1789517412880)
ON CONFLICT(id) DO UPDATE SET password_hash = 'pbkdf2$SHA-256$600000$lYlLFQqq0apoDNW9V3G0/Q==$bwBNl8IH/qhrvBGThBLz1XdWTgSdyPLnmhYb3j5MOOk=', status = 'ACTIVE', updated_at = 1789517412880;

INSERT INTO employees (id, user_id, employee_id, full_name, mobile, email, department_id, designation_id, is_active, created_at, updated_at)
VALUES ('c0000000-0000-4000-8000-000000001002', 'u0000000-0000-4000-8000-000000001002', 'S1002', 'Operations Manager', '+14155550102', 'manager@pinnacle.com', 'd0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002', 1, 1789517412880, 1789517412880)
ON CONFLICT(id) DO UPDATE SET is_active = 1, department_id = 'd0000000-0000-4000-8000-000000000001', designation_id = 'e0000000-0000-4000-8000-000000000002', full_name = 'Operations Manager', email = 'manager@pinnacle.com', updated_at = 1789517412880;

INSERT OR IGNORE INTO employee_roles (employee_id, role_id, assigned_at) VALUES ('c0000000-0000-4000-8000-000000001002', '8dc8f112-1c8d-4c70-9cf3-0a250f2f4003', 1789517412880);

-- 5. Upsert Employee S1003 (Managed by S1002)
INSERT INTO users (id, password_hash, status, created_at, updated_at) VALUES ('u0000000-0000-4000-8000-000000001003', 'pbkdf2$SHA-256$600000$pQGOoTnOx9/cAZMV06RKBw==$MW/OmdRnI/5Q0OhUNd8NHIpG01KZUTPTBQRUKznDrbk=', 'ACTIVE', 1789517412880, 1789517412880)
ON CONFLICT(id) DO UPDATE SET password_hash = 'pbkdf2$SHA-256$600000$pQGOoTnOx9/cAZMV06RKBw==$MW/OmdRnI/5Q0OhUNd8NHIpG01KZUTPTBQRUKznDrbk=', status = 'ACTIVE', updated_at = 1789517412880;

INSERT INTO employees (id, user_id, employee_id, manager_employee_id, full_name, mobile, email, department_id, designation_id, is_active, created_at, updated_at)
VALUES ('c0000000-0000-4000-8000-000000001003', 'u0000000-0000-4000-8000-000000001003', 'S1003', 'c0000000-0000-4000-8000-000000001002', 'Operations Specialist', '+14155550103', 'employee@pinnacle.com', 'd0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 1, 1789517412880, 1789517412880)
ON CONFLICT(id) DO UPDATE SET is_active = 1, manager_employee_id = 'c0000000-0000-4000-8000-000000001002', department_id = 'd0000000-0000-4000-8000-000000000001', designation_id = 'e0000000-0000-4000-8000-000000000001', full_name = 'Operations Specialist', email = 'employee@pinnacle.com', updated_at = 1789517412880;

INSERT OR IGNORE INTO employee_roles (employee_id, role_id, assigned_at) VALUES ('c0000000-0000-4000-8000-000000001003', '8dc8f112-1c8d-4c70-9cf3-0a250f2f4004', 1789517412880);

-- 6. Set sequence for next applicant to S1004
INSERT INTO employee_id_sequences (name, next_value, updated_at) VALUES ('EMPLOYEE', 1004, 1789517412880)
ON CONFLICT(name) DO UPDATE SET next_value = MAX(next_value, 1004);

-- 7. Seed Vendors
DELETE FROM vendors WHERE id IN ('v1000000-0000-4000-8000-000000000001', 'v1000000-0000-4000-8000-000000000002', 'v1000000-0000-4000-8000-000000000003');
INSERT INTO vendors (id, vendor_id, name, category, contact_person, phone, email, location, status, assigned_employee_id, created_at, updated_at) VALUES
('v1000000-0000-4000-8000-000000000001', 'V1001', 'Apex Fabrication Labs', 'FABRICATION', 'Ramesh Sharma', '+91-98200-11223', 'ramesh@apexfab.in', 'Mumbai, MH', 'ACTIVE', 'c0000000-0000-4000-8000-000000001003', 1789517412880, 1789517412880),
('v1000000-0000-4000-8000-000000000002', 'V1002', 'Swift Logistics & Transit', 'LOGISTICS', 'Anita Desai', '+91-98200-44556', 'anita@swifttransit.in', 'Bhiwandi, MH', 'ACTIVE', 'c0000000-0000-4000-8000-000000001003', 1789517412880, 1789517412880),
('v1000000-0000-4000-8000-000000000003', 'V1003', 'Aura Sound & Visual Systems', 'EQUIPMENT', 'Vikram Mehta', '+91-98200-77889', 'vikram@aurasound.in', 'Bengaluru, KA', 'ACTIVE', 'c0000000-0000-4000-8000-000000001002', 1789517412880, 1789517412880);

-- 8. Clean and Seed CRM Clients
DELETE FROM clients WHERE id IN ('c1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000003');
INSERT INTO clients (id, name, company_name, email, phone, status, assigned_employee_id, created_at, updated_at) VALUES
('c1000000-0000-4000-8000-000000000001', 'Marcus Vance', 'Apex Logistics Corp', 'marcus.vance@apexlogistics.com', '+1-555-0191', 'ACTIVE', 'c0000000-0000-4000-8000-000000001003', 1789517412880, 1789517412880),
('c1000000-0000-4000-8000-000000000002', 'Elena Rostova', 'Zenith Retail Group', 'elena.rostova@zenithretail.com', '+1-555-0192', 'ACTIVE', 'c0000000-0000-4000-8000-000000001003', 1789517412880, 1789517412880),
('c1000000-0000-4000-8000-000000000003', 'David Sterling', 'Nordic Energy Systems', 'd.sterling@nordicenergy.com', '+1-555-0193', 'ACTIVE', 'c0000000-0000-4000-8000-000000001002', 1789517412880, 1789517412880);

-- 9. Seed Projects & Project Milestones
DELETE FROM project_milestones WHERE project_id IN ('p1000000-0000-4000-8000-000000000001', 'p1000000-0000-4000-8000-000000000002', 'p1000000-0000-4000-8000-000000000003');
DELETE FROM projects WHERE id IN ('p1000000-0000-4000-8000-000000000001', 'p1000000-0000-4000-8000-000000000002', 'p1000000-0000-4000-8000-000000000003');

INSERT INTO projects (id, project_code, title, client_id, owner_employee_id, vendor_id, status, budget, start_date, target_date, created_at, updated_at) VALUES
('p1000000-0000-4000-8000-000000000001', 'P-2026-001', 'Apex Global Logistics Expo Pavilion', 'c1000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000001003', 'v1000000-0000-4000-8000-000000000001', 'DISPATCH', 4500000, 1786991399999, 1791397799999, 1789517412880, 1789517412880),
('p1000000-0000-4000-8000-000000000002', 'P-2026-002', 'Zenith Retail Flagship Telematics Concourse', 'c1000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000001003', 'v1000000-0000-4000-8000-000000000003', 'FABRICATION', 6200000, 1788719399999, 1792780199999, 1789517412880, 1789517412880),
('p1000000-0000-4000-8000-000000000003', 'P-2026-003', 'Nordic Clean Energy Summit Infrastructure', 'c1000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000001002', 'v1000000-0000-4000-8000-000000000002', 'LIVE', 8500000, 1785695399999, 1789669799999, 1789517412880, 1789517412880);

-- Milestones for Project 1
INSERT INTO project_milestones (id, project_id, stage, title, status, due_date, created_at, updated_at) VALUES
('pm100000-0000-4000-8000-000000000001', 'p1000000-0000-4000-8000-000000000001', 'FABRICATION', 'Modular Framework & Truss Production', 'COMPLETED', 1788719399999, 1789517412880, 1789517412880),
('pm100000-0000-4000-8000-000000000002', 'p1000000-0000-4000-8000-000000000001', 'DISPATCH', 'Fleet Loading & Transit to Pragati Maidan', 'IN_PROGRESS', 1789583399999, 1789517412880, 1789517412880),
('pm100000-0000-4000-8000-000000000003', 'p1000000-0000-4000-8000-000000000001', 'SETUP', 'On-site Assembly & AV Rigging', 'PENDING', 1789756199999, 1789517412880, 1789517412880),
('pm100000-0000-4000-8000-000000000004', 'p1000000-0000-4000-8000-000000000001', 'LIVE', 'Expo Operations & Telemetry Support', 'PENDING', 1789928999999, 1789517412880, 1789517412880),
('pm100000-0000-4000-8000-000000000005', 'p1000000-0000-4000-8000-000000000001', 'DISMANTLE', 'Safe De-rigging and Return Logistics', 'PENDING', 1790101799999, 1789517412880, 1789517412880),
('pm100000-0000-4000-8000-000000000006', 'p1000000-0000-4000-8000-000000000001', 'CLOSURE_PACK', 'Sign-off Audit & Client Acceptance Dossier', 'PENDING', 1790274599999, 1789517412880, 1789517412880);

-- 10. Seed Invoices & Payments
DELETE FROM payments WHERE invoice_id IN ('i1000000-0000-4000-8000-000000000001', 'i1000000-0000-4000-8000-000000000002', 'i1000000-0000-4000-8000-000000000003');
DELETE FROM invoices WHERE id IN ('i1000000-0000-4000-8000-000000000001', 'i1000000-0000-4000-8000-000000000002', 'i1000000-0000-4000-8000-000000000003');

INSERT INTO invoices (id, invoice_number, client_id, project_id, amount, status, issue_date, due_date, notes, created_at, updated_at) VALUES
('i1000000-0000-4000-8000-000000000001', 'INV-2026-001', 'c1000000-0000-4000-8000-000000000002', 'p1000000-0000-4000-8000-000000000002', 1250000, 'PAID', 1786991399999, 1788719399999, 'Initial advance mobilization for POS Telematics concourse.', 1789517412880, 1789517412880),
('i1000000-0000-4000-8000-000000000002', 'INV-2026-002', 'c1000000-0000-4000-8000-000000000001', 'p1000000-0000-4000-8000-000000000001', 3500000, 'PARTIALLY_PAID', 1785695399999, 1788719399999, 'Fabrication completion milestone invoice.', 1789517412880, 1789517412880),
('i1000000-0000-4000-8000-000000000003', 'INV-2026-003', 'c1000000-0000-4000-8000-000000000003', 'p1000000-0000-4000-8000-000000000003', 800000, 'ISSUED', 1788719399999, 1790188199999, 'Live summit telematics integration fees.', 1789517412880, 1789517412880);

INSERT INTO payments (id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at) VALUES
('py100000-0000-4000-8000-000000000001', 'i1000000-0000-4000-8000-000000000001', 1250000, 1788719399999, 'BANK_TRANSFER', 'NEFT-AXIS-20260901-0987', 'Full settlement received from Zenith Finance.', 1789517412880),
('py100000-0000-4000-8000-000000000002', 'i1000000-0000-4000-8000-000000000002', 2000000, 1787855399999, 'BANK_TRANSFER', 'RTGS-HDFC-20260825-4421', 'First tranche mobilization payment.', 1789517412880);

-- 11. Seed Operational Tasks, Delays, CRM
DELETE FROM task_delay_requests WHERE requested_by_employee_id IN ('c0000000-0000-4000-8000-000000001002', 'c0000000-0000-4000-8000-000000001003', 'c0000000-0000-4000-8000-000000001000');
DELETE FROM tasks WHERE assigned_to_employee_id IN ('c0000000-0000-4000-8000-000000001002', 'c0000000-0000-4000-8000-000000001003', 'c0000000-0000-4000-8000-000000001000') OR assigned_by_employee_id IN ('c0000000-0000-4000-8000-000000001002', 'c0000000-0000-4000-8000-000000001003', 'c0000000-0000-4000-8000-000000001000');
DELETE FROM follow_ups WHERE employee_id IN ('c0000000-0000-4000-8000-000000001002', 'c0000000-0000-4000-8000-000000001003', 'c0000000-0000-4000-8000-000000001000');
DELETE FROM meetings WHERE employee_id IN ('c0000000-0000-4000-8000-000000001002', 'c0000000-0000-4000-8000-000000001003', 'c0000000-0000-4000-8000-000000001000');
DELETE FROM opportunities WHERE owner_employee_id IN ('c0000000-0000-4000-8000-000000001002', 'c0000000-0000-4000-8000-000000001003', 'c0000000-0000-4000-8000-000000001000');
DELETE FROM daily_work_reports WHERE employee_id IN ('c0000000-0000-4000-8000-000000001002', 'c0000000-0000-4000-8000-000000001003', 'c0000000-0000-4000-8000-000000001000');
DELETE FROM employee_targets WHERE employee_id IN ('c0000000-0000-4000-8000-000000001002', 'c0000000-0000-4000-8000-000000001003', 'c0000000-0000-4000-8000-000000001000');

-- Tasks
INSERT INTO tasks (id, title, description, assigned_to_employee_id, assigned_by_employee_id, client_id, priority, status, original_due_date, current_due_date, created_at, updated_at) VALUES
('t1000000-0000-4000-8000-000000000001', 'Dispatch Q3 Vendor Compliance Audit Checklist', 'Send formal verification and warehouse security compliance checklist to Marcus Vance.', 'c0000000-0000-4000-8000-000000001003', 'c0000000-0000-4000-8000-000000001002', 'c1000000-0000-4000-8000-000000000001', 'P1', 'TODO', 1789583399999, 1789583399999, 1789517412880, 1789517412880),
('t1000000-0000-4000-8000-000000000002', 'Zenith Retail POS Telematics Integration Scope', 'Gather API payload requirements and webhook callbacks from client engineering lead.', 'c0000000-0000-4000-8000-000000001003', 'c0000000-0000-4000-8000-000000001002', 'c1000000-0000-4000-8000-000000000002', 'P2', 'IN_PROGRESS', 1789669799999, 1789669799999, 1789517412880, 1789517412880),
('t1000000-0000-4000-8000-000000000003', 'Nordic Energy Monthly Ops Reconciliation', 'Verify all 42 warehouse receipt manifests against cross-dock consignment records.', 'c0000000-0000-4000-8000-000000001003', 'c0000000-0000-4000-8000-000000001002', 'c1000000-0000-4000-8000-000000000003', 'P2', 'PENDING_VERIFICATION', 1789496999999, 1789496999999, 1789517412880, 1789517412880),
('t1000000-0000-4000-8000-000000000004', 'Q3 Regional Ops Staffing & Capacity Review', 'Prepare team utilization report and projected headcount requirements for Q4.', 'c0000000-0000-4000-8000-000000001002', 'c0000000-0000-4000-8000-000000001000', NULL, 'P1', 'IN_PROGRESS', 1790188199999, 1790188199999, 1789517412880, 1789517412880);

UPDATE tasks SET evidence = 'https://docs.pinnacle.internal/ops/nordic-reconciliation-aug26.pdf', evidence_type = 'LINK', maker_notes = 'Reconciled all 42 purchase orders with warehouse manifests. Discrepancies resolved. Awaiting manager sign-off.' WHERE id = 't1000000-0000-4000-8000-000000000003';

-- Delay Request for Task 2
INSERT INTO task_delay_requests (id, task_id, requested_by_employee_id, original_due_date, requested_due_date, reason, business_impact, status, created_at, updated_at) VALUES
('d1000000-0000-4000-8000-000000000001', 't1000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000001003', 1789669799999, 1789842599999, 'Client IT Director out of office until Thursday; awaiting webhook endpoint specifications.', 'Technical scoping milestone shifted by 2 business days; no impact on final delivery schedule.', 'PENDING', 1789517412880, 1789517412880);

-- Follow-ups for S1003
INSERT INTO follow_ups (id, client_id, employee_id, date, type, status, outcome, next_action, next_follow_up_date, notes, created_at, updated_at) VALUES
('f1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000001003', 1789579799999, 'CALL', 'UPCOMING', NULL, 'Review signed delivery SLAs and resolve demurrage waiver request', 1789669799999, 'Marcus requested quick alignment call on customs demurrage line items.', 1789517412880, 1789517412880),
('f1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000001003', 1789669799999, 'EMAIL', 'UPCOMING', NULL, 'Send revised implementation roadmap', NULL, 'Provide updated sprint estimates once API spec is received.', 1789517412880, 1789517412880);

-- Meetings for S1003
INSERT INTO meetings (id, client_id, employee_id, title, scheduled_at, status, notes, outcome, next_action, created_at, updated_at) VALUES
('m1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000001003', 'Quarterly Service Review - Apex Operations', 1789551000000, 'SCHEDULED', 'Review Q2 metrics, container dwell times, and Q3 expansion.', NULL, 'Finalize minutes of meeting within 24h', 1789517412880, 1789517412880);

-- Opportunities for S1003
INSERT INTO opportunities (id, client_id, owner_employee_id, title, stage, estimated_value, probability, expected_close_date, next_action, status, created_at, updated_at) VALUES
('o1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000001003', 'Enterprise Fleet Route Optimization System', 'PROPOSAL', 1250000, 70, 1791052199999, 'Deliver security architecture questionnaire', 'ACTIVE', 1789517412880, 1789517412880),
('o1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000001003', 'Automated Dispatch Telematics Integration', 'OPPORTUNITY', 800000, 40, 1791397799999, 'Technical discovery call with VP Ops', 'ACTIVE', 1789517412880, 1789517412880);

-- Employee Targets for S1003
INSERT INTO employee_targets (id, employee_id, period_type, period_start, period_end, target_amount, achieved_amount, target_calls, target_meetings, target_deals, created_at, updated_at) VALUES
('e1000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000001003', 'MONTHLY', '2026-09-01', '2026-09-30', 2000000, 850000, 60, 15, 3, 1789517412880, 1789517412880);

-- Daily Work Reports for S1003
INSERT INTO daily_work_reports (id, employee_id, report_date, status, calls_count, meetings_count, follow_ups_count, deals_summary, completed_tasks_summary, pending_tasks_summary, notes, submitted_at, reviewed_by_employee_id, reviewed_at, created_at, updated_at) VALUES
('r1000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000001003', '2026-09-15', 'APPROVED', 8, 2, 4, 'Progressed Zenith proposal to stage 2', 'Completed warehouse audit documentation for Nordic Energy', 'Awaiting Apex customs clearance release', 'Steady progress across all assigned accounts.', 1789431013608, 'c0000000-0000-4000-8000-000000001002', 1789517412880, 1789517412880, 1789517412880);
