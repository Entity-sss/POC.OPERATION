import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  assignTask,
  createClient,
  createInvoice,
  createVendor,
  getFinanceData,
  recordPayment,
  reviewDailyWorkReport,
  reviewDelayRequest,
  saveDailyWorkReport,
  updateProjectStatus,
  verifyTask,
} from './operations';
import { AuthError, type AuthenticatedPrincipal } from '@/lib/auth/service';

describe('Operations Service & Maker-Checker Integrity', () => {
  const mockPrincipal: AuthenticatedPrincipal = {
    id: 'user-001',
    employeeId: 'EMP-001',
    employeeUuid: 'emp-uuid-001',
    email: 'user@pinnacle.com',
    fullName: 'Test Employee',
    isActive: true,
    roles: ['EMPLOYEE'],
    dataScopes: ['SELF'],
  };

  const mockCheckerPrincipal: AuthenticatedPrincipal = {
    id: 'user-002',
    employeeId: 'MGR-001',
    employeeUuid: 'emp-uuid-mgr-002',
    email: 'manager@pinnacle.com',
    fullName: 'Test Manager',
    isActive: true,
    roles: ['MANAGER'],
    dataScopes: ['TEAM'],
  };

  test('maker-checker rule: cannot verify tasks assigned to oneself', async () => {
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => [
              {
                id: 'task-100',
                title: 'Demurrage clearance documentation',
                assignedToEmployeeId: 'emp-uuid-001', // Assigned to mockPrincipal
                status: 'PENDING_VERIFICATION',
              },
            ],
          }),
        }),
      }),
    };

    await assert.rejects(
      async () => {
        await verifyTask(mockDb, mockPrincipal, 'task-100', { approved: true });
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        assert.equal(err.code, 'SELF_VERIFICATION_FORBIDDEN');
        return true;
      }
    );
  });

  test('maker-checker rule: distinct checker is allowed to verify task', async () => {
    let updatedValues: any = null;
    let auditEntry: any = null;

    let queryCount = 0;
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => {
              queryCount++;
              if (queryCount === 1) {
                return [
                  {
                    id: 'task-100',
                    title: 'Demurrage clearance documentation',
                    assignedToEmployeeId: 'emp-uuid-001', // Assigned to maker
                    status: 'PENDING_VERIFICATION',
                  },
                ];
              }
              // query for assignee to check managerEmployeeId
              return [
                {
                  id: 'emp-uuid-001',
                  managerEmployeeId: 'emp-uuid-mgr-002',
                },
              ];
            },
          }),
        }),
      }),
      update: () => ({
        set: (vals: any) => {
          updatedValues = vals;
          return {
            where: () => Promise.resolve(),
          };
        },
      }),
      insert: () => ({
        values: (entry: any) => {
          auditEntry = entry;
          return Promise.resolve();
        },
      }),
    };

    const result = await verifyTask(mockDb, mockCheckerPrincipal, 'task-100', {
      approved: true,
      checkerNotes: 'All customs demurrage bills verified against bills of lading.',
    });

    assert.equal(result.success, true);
    assert.equal(result.status, 'COMPLETED');
    assert.equal(updatedValues.status, 'COMPLETED');
    assert.equal(updatedValues.verifiedByEmployeeId, 'emp-uuid-mgr-002');
    assert.ok(auditEntry, 'Audit log must be created on verification');
  });

  test('maker-checker rejection: transitions status back to IN_PROGRESS', async () => {
    let updatedValues: any = null;
    let queryCount = 0;

    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => {
              queryCount++;
              if (queryCount === 1) {
                return [
                  {
                    id: 'task-101',
                    title: 'Vendor SLA review',
                    assignedToEmployeeId: 'emp-uuid-001',
                    status: 'PENDING_VERIFICATION',
                  },
                ];
              }
              return [
                {
                  id: 'emp-uuid-001',
                  managerEmployeeId: 'emp-uuid-mgr-002',
                },
              ];
            },
          }),
        }),
      }),
      update: () => ({
        set: (vals: any) => {
          updatedValues = vals;
          return {
            where: () => Promise.resolve(),
          };
        },
      }),
      insert: () => ({
        values: () => Promise.resolve(),
      }),
    };

    const result = await verifyTask(mockDb, mockCheckerPrincipal, 'task-101', {
      approved: false,
      checkerNotes: 'Missing gate pass evidence.',
    });

    assert.equal(result.success, true);
    assert.equal(result.status, 'IN_PROGRESS');
    assert.equal(updatedValues.status, 'IN_PROGRESS');
    assert.equal(updatedValues.completedAt, null);
  });
});

describe('Daily report lifecycle', () => {
  const employeePrincipal: AuthenticatedPrincipal = {
    id: 'employee-user',
    employeeId: 'EMP-001',
    employeeUuid: 'employee-uuid',
    email: 'employee@example.com',
    fullName: 'Employee One',
    isActive: true,
    roles: ['EMPLOYEE'],
    dataScopes: ['SELF'],
  };

  const managerPrincipal: AuthenticatedPrincipal = {
    id: 'manager-user',
    employeeId: 'MGR-001',
    employeeUuid: 'manager-uuid',
    email: 'manager@example.com',
    fullName: 'Manager One',
    isActive: true,
    roles: ['MANAGER'],
    dataScopes: ['TEAM'],
  };

  test('employee cannot change a report while it awaits review', async () => {
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => [{ id: 'report-1', status: 'SUBMITTED' }],
          }),
        }),
      }),
    };

    await assert.rejects(
      () => saveDailyWorkReport(mockDb, employeePrincipal, { reportDate: '2026-10-07', status: 'DRAFT' }),
      (error: any) => error instanceof AuthError && error.status === 409 && error.code === 'REPORT_PENDING_REVIEW',
    );
  });

  test('manager cannot decide a report that was not submitted', async () => {
    let queryCount = 0;
    let updated = false;
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => {
              queryCount++;
              return queryCount === 1
                ? [{ id: 'report-1', employeeId: 'employee-uuid', reportDate: '2026-10-07', status: 'DRAFT' }]
                : [{ managerEmployeeId: managerPrincipal.employeeUuid }];
            },
          }),
        }),
      }),
      update: () => ({
        set: () => {
          updated = true;
          return { where: () => Promise.resolve() };
        },
      }),
    };

    await assert.rejects(
      () => reviewDailyWorkReport(mockDb, managerPrincipal, 'report-1', { action: 'APPROVE' }),
      (error: any) => error instanceof AuthError && error.status === 409 && error.code === 'REPORT_NOT_SUBMITTED',
    );
    assert.equal(updated, false);
  });
});

describe('Task delay review lifecycle', () => {
  test('manager cannot change a task for an already approved delay request', async () => {
    const managerPrincipal: AuthenticatedPrincipal = {
      id: 'manager-user',
      employeeId: 'MGR-001',
      employeeUuid: 'manager-uuid',
      email: 'manager@example.com',
      fullName: 'Manager One',
      isActive: true,
      roles: ['MANAGER'],
      dataScopes: ['TEAM'],
    };
    let queryCount = 0;
    let updateCount = 0;
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => {
              queryCount++;
              return queryCount === 1
                ? [{ id: 'delay-1', taskId: 'task-1', requestedByEmployeeId: 'employee-uuid', status: 'APPROVED' }]
                : [{ managerEmployeeId: managerPrincipal.employeeUuid }];
            },
          }),
        }),
      }),
      update: () => ({
        set: () => {
          updateCount++;
          return { where: () => Promise.resolve() };
        },
      }),
    };

    await assert.rejects(
      () => reviewDelayRequest(mockDb, managerPrincipal, 'delay-1', { action: 'REJECT' }),
      (error: any) => error instanceof AuthError && error.status === 409 && error.code === 'DELAY_REQUEST_NOT_PENDING',
    );
    assert.equal(updateCount, 0);
  });
});

describe('Role-Based Authorization, Data Scoping & IDOR Prevention (Batch 1)', () => {
  const employeePrincipal: AuthenticatedPrincipal = {
    id: 'user-emp',
    employeeId: 'EMP-010',
    employeeUuid: 'emp-uuid-010',
    email: 'emp@pinnacle.com',
    fullName: 'Employee Ten',
    isActive: true,
    roles: ['EMPLOYEE'],
    dataScopes: ['SELF'],
  };

  const managerPrincipal: AuthenticatedPrincipal = {
    id: 'user-mgr',
    employeeId: 'MGR-020',
    employeeUuid: 'emp-uuid-mgr-020',
    email: 'mgr@pinnacle.com',
    fullName: 'Manager Twenty',
    isActive: true,
    roles: ['MANAGER'],
    dataScopes: ['TEAM'],
  };

  
  test('getFinanceData: employee is rejected with 403 FORBIDDEN', async () => {
    const mockDb: any = {};
    await assert.rejects(
      async () => {
        await getFinanceData(mockDb, employeePrincipal);
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        assert.equal(err.code, 'FORBIDDEN');
        return true;
      }
    );
  });

  test('getFinanceData: manager without finance role is rejected with 403 FORBIDDEN', async () => {
    const mockDb: any = {};
    await assert.rejects(
      async () => {
        await getFinanceData(mockDb, managerPrincipal);
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        assert.equal(err.code, 'FORBIDDEN');
        return true;
      }
    );
  });

  test('createInvoice: employee cannot create invoices (403 FORBIDDEN)', async () => {
    const mockDb: any = {};
    await assert.rejects(
      async () => {
        await createInvoice(mockDb, employeePrincipal, {
          clientId: 'client-1',
          amount: 50000,
          issueDate: Date.now(),
          dueDate: Date.now() + 86400000,
        });
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        return true;
      }
    );
  });

  test('recordPayment: employee cannot record payments (403 FORBIDDEN)', async () => {
    const mockDb: any = {};
    await assert.rejects(
      async () => {
        await recordPayment(mockDb, employeePrincipal, {
          invoiceId: 'inv-1',
          amount: 25000,
          paymentDate: Date.now(),
        });
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        return true;
      }
    );
  });

  test('createVendor: employee cannot create vendors (403 FORBIDDEN)', async () => {
    const mockDb: any = {};
    await assert.rejects(
      async () => {
        await createVendor(mockDb, employeePrincipal, {
          name: 'Shadow Vendor',
          category: 'FABRICATION',
          contactPerson: 'Agent',
        });
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        return true;
      }
    );
  });

  test('updateProjectStatus: employee cannot update project status (403 FORBIDDEN)', async () => {
    const mockDb: any = {};
    await assert.rejects(
      async () => {
        await updateProjectStatus(mockDb, employeePrincipal, 'proj-1', 'COMPLETED');
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        return true;
      }
    );
  });

  test('updateProjectStatus: manager cannot update project owned by other team (403 TEAM_SCOPE_VIOLATION)', async () => {
    let queryCount = 0;
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => {
              queryCount++;
              if (queryCount === 1) {
                // Project record: owned by different employee
                return [{ id: 'proj-1', title: 'External Project', status: 'FABRICATION', ownerEmployeeId: 'emp-other' }];
              }
              // Owner employee query: managed by someone else
              return [{ id: 'emp-other', managerEmployeeId: 'other-manager-uuid' }];
            },
          }),
        }),
      }),
    };

    await assert.rejects(
      async () => {
        await updateProjectStatus(mockDb, managerPrincipal, 'proj-1', 'SETUP');
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        assert.equal(err.code, 'TEAM_SCOPE_VIOLATION');
        return true;
      }
    );
  });

  test('assignTask: employee cannot assign tasks (403 FORBIDDEN)', async () => {
    const mockDb: any = {};
    await assert.rejects(
      async () => {
        await assignTask(mockDb, employeePrincipal, {
          title: 'Unauthorized Task',
          assignedToEmployeeId: 'emp-uuid-010',
          dueDate: Date.now() + 86400000,
          priority: 'P2',
        });
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        return true;
      }
    );
  });

  test('assignTask: manager cannot assign task to non-team member (403 TEAM_SCOPE_VIOLATION)', async () => {
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => [
              // Employee who reports to someone else
              { id: 'emp-alien', fullName: 'Alien Emp', managerEmployeeId: 'some-other-manager' },
            ],
          }),
        }),
      }),
    };

    await assert.rejects(
      async () => {
        await assignTask(mockDb, managerPrincipal, {
          title: 'Cross-team Task',
          assignedToEmployeeId: 'emp-alien',
          dueDate: Date.now() + 86400000,
          priority: 'P2',
        });
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        assert.equal(err.code, 'TEAM_SCOPE_VIOLATION');
        return true;
      }
    );
  });

  test('createClient: prevents privilege escalation by overriding assignedEmployeeId for employees', async () => {
    let insertedClient: any = null;
    const mockDb: any = {
      insert: () => ({
        values: (data: any) => {
          if (!insertedClient) {
            insertedClient = data;
          }
          return Promise.resolve();
        },
      }),
    };

    // Employee attempts to assign client to another employee
    await createClient(mockDb, employeePrincipal, {
      name: 'Client Alpha',
      companyName: 'Alpha Corp',
      assignedEmployeeId: 'victim-employee-uuid',
    });

    assert.ok(insertedClient);
    // Crucial check: assignedEmployeeId MUST be overridden to employee's own employeeUuid
    assert.equal(insertedClient.assignedEmployeeId, 'emp-uuid-010');
  });
});
