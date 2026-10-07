# POC.OPERATION Cleanup & Stabilization Plan

**Generated:** 2026-10-07  
**Objective:** Move from demo phase to real organizational structure

## Phase 1: Pre-Migration Audit ✓

### Current State (Verified)
- **Database:** 4 demo employees (S1000-S1003), 4 clients, 4 tasks, 3 projects
- **Codebase:** 93 source files, largest components 1400+ lines
- **Build:** Clean (0 errors, 0 warnings)
- **Demo accounts:** Seeded via `scripts/seed-demo-accounts.mjs`

## Phase 2: Real Employee Structure Design

### Pinnacle Organization Structure

#### Business Head
- **Luvneet A.** — Business Head

#### CEO Desk
- **Ganesh Sanap** — Intern (Primary: Revenue Pod 2 Lead Gen, Additional: CEO Desk)
- **Jason** — Intern (Primary: Revenue Pod 1 Lead Gen, Additional: CEO Desk)

#### Revenue Pod 1 — Existing Accounts
- **Sonal A.** — Senior Revenue Lead
- **Pratiksha Kacha** — Client Servicing Manager
- **Client Servicing / BD** — VACANT POSITION
- **Jason** — Lead Generation Intern (assigned here)

#### Revenue Pod 2 — Growth / New Business
- **Neha Mayekar** — Deputy Growth Revenue
- **Ganesh Sanap** — Lead Generation Intern (assigned here)

#### Operations
- **Harsh Aswale** — Manager Operations
- **Deepak** — Junior Operations

#### Shared Services
- **Vedika** — Vendor Procurement
- **Gautam** — Vendor Procurement Intern
- **3D / Graphic Designer** — PENDING POSITION
- **Shweta** — Finance / Accounts

#### Inactive (Do Not Create)
- Dhruv — no longer working
- Adarsh Nair — no longer working

### Key Principles
1. **One person = one employee account**
2. **No invented data** (email, phone, DOB, etc.)
3. **Vacant positions = positions, not fake accounts**
4. **Real administrative account must exist and work before demo deletion**

## Phase 3: Database Migration Strategy

### Step 1: Create Real Admin Account
- Verify first-admin provisioning flow works
- Create real admin with secure credentials
- **Test login before proceeding**

### Step 2: Schema Updates (if needed)
- Add fields for: primary_team, additional_responsibilities
- Add vacant_positions table or handle via designations

### Step 3: Create Real Employees
- Use actual names only
- Leave unknown fields NULL/empty
- Use employee ID sequence system
- Preserve audit trail integrity

### Step 4: Safe Demo Account Removal
- Mark demo accounts as inactive (soft delete)
- Preserve foreign key integrity
- Keep audit logs intact
- Only hard delete if absolutely necessary

## Phase 4: Codebase Cleanup

### Component Refactoring Priority
1. **EmployeeCockpit.tsx** (1435 lines) → Extract reusable modules
2. **ManagerOperationsCenter.tsx** (1227 lines) → Extract reusable modules
3. **RegistrationApprovals.tsx** (753 lines) → Simplify approval flow
4. **EmployeeManagement.tsx** (712 lines) → Extract employee CRUD services

### Architecture Cleanup
- Remove duplicate logic
- Consolidate API service calls
- Remove dead code (confirm no dependencies first)
- Clean up scratch directory

### API Verification
- Map each workspace to its backend API
- Verify full request → response → refresh flow
- Identify APIs with no frontend consumer
- Identify frontend using fake/static data

## Phase 5: Performance Optimization

### Measurement First
- Establish baseline SSR execution time
- Profile D1 query performance
- Identify query waterfalls
- Measure client bundle size

### Optimization Targets
- Parallel independent queries
- Use SQL aggregates for metrics
- Cache auth/principal per request
- Lazy-load heavy workspaces (already started)
- Keep initial shell small

## Phase 6: Full System Verification

### Backend Flows to Verify
- [ ] Employee registration → approval → login
- [ ] Task assignment → view → completion → verification
- [ ] Client creation → CRM → refresh
- [ ] Opportunity creation → deal pipeline → refresh
- [ ] Project creation → operations view → refresh
- [ ] Invoice/payment → finance → aging
- [ ] Delay request → approval → revised date

### Security Audit
- [ ] Authentication on all protected routes
- [ ] Role-based permissions
- [ ] Data scope (self/team/company)
- [ ] Prevent self-approval
- [ ] IDOR prevention

## Phase 7: UI Consistency

### Design System Application
- White/light main workspace
- Dark readable content
- Professional typography
- High-contrast tables
- No faded important text
- Consistent across all roles

## Phase 8: Final Cleanup

### Remove Obsolete Code
- [ ] Unused demo-specific code
- [ ] Duplicate workspace implementations
- [ ] Dead starter components
- [ ] Stale routes
- [ ] Unused mock data
- [ ] Scratch directory test files

### Final Validation
- [ ] TypeScript checks pass
- [ ] Build succeeds
- [ ] Tests pass
- [ ] Important API routes work
- [ ] Authentication/authorization work
- [ ] Database persistence works
- [ ] Browser refresh persistence works
- [ ] Performance measured and acceptable

## Risks & Mitigations

### Risk: Losing admin access during migration
**Mitigation:** Create and verify new admin before deleting demo accounts

### Risk: Breaking audit trail
**Mitigation:** Soft delete (is_active = false) rather than hard delete where possible

### Risk: Performance regression
**Mitigation:** Measure before/after, don't hide slow backend behind spinner

### Risk: Breaking existing functionality
**Mitigation:** Verify each major flow after changes

## Success Criteria

1. ✅ Real employees match current Pinnacle organization
2. ✅ One account per person (Ganesh, Jason)
3. ✅ No demo accounts active
4. ✅ No invented employee data
5. ✅ All major workflows verified end-to-end
6. ✅ Performance measured and acceptable
7. ✅ Clean build with no suppressions
8. ✅ Application runs and loads reasonably fast
9. ✅ Security audit passes
10. ✅ UI consistent across roles

## Execution Order

1. Audit (DONE)
2. Design real employee structure (DONE)
3. Create migration scripts
4. Create real admin account and verify
5. Create real employee accounts
6. Deactivate demo accounts
7. Clean up codebase systematically
8. Verify all workflows
9. Measure performance
10. Final cleanup and validation
