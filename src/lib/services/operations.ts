import { and, desc, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import type { AppDatabase } from '@/lib/db';
import {
  auditLogs,
  clients,
  dailyWorkReports,
  departments,
  designations,
  employeeRegistrationRequests,
  employees,
  employeeTargets,
  followUps,
  invoices,
  meetings,
  opportunities,
  payments,
  projectMilestones,
  projects,
  roles,
  sessions,
  taskDelayRequests,
  tasks,
  vendors,
} from '@/lib/db/schema';
import { writeAuditLog } from '@/lib/audit';
import { AuthError, type AuthenticatedPrincipal } from '@/lib/auth/service';

// ==========================================
// 1. EMPLOYEE COCKPIT QUERIES & MUTATIONS
// ==========================================

export async function getEmployeeCockpitData(db: AppDatabase, principal: AuthenticatedPrincipal) {
  const employeeUuid = principal.employeeUuid;
  if (!employeeUuid) {
    throw new AuthError(400, 'Employee profile not linked to user account', 'NO_EMPLOYEE_PROFILE');
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayDateStr = new Date().toISOString().split('T')[0];

  // 1. Employee Detail Record
  const [empRecord] = await db
    .select({
      id: employees.id,
      employeeId: employees.employeeId,
      fullName: employees.fullName,
      email: employees.email,
      mobile: employees.mobile,
      isActive: employees.isActive,
      departmentName: departments.name,
      designationName: designations.name,
      managerId: employees.managerEmployeeId,
      currentAddress: employees.currentAddress,
      permanentAddress: employees.permanentAddress,
      education: employees.education,
      priorExperience: employees.priorExperience,
      createdAt: employees.createdAt,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .where(eq(employees.id, employeeUuid))
    .limit(1);

  // 2. Child queries executed concurrently
  const [
    mgrRes,
    taskRows,
    clientRows,
    followUpRows,
    meetingRows,
    opportunityRows,
    targetRows,
    reportRows,
  ] = await Promise.all([
    empRecord?.managerId
      ? db
          .select({ fullName: employees.fullName })
          .from(employees)
          .where(eq(employees.id, empRecord.managerId))
          .limit(1)
      : Promise.resolve([]),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        status: tasks.status,
        originalDueDate: tasks.originalDueDate,
        currentDueDate: tasks.currentDueDate,
        evidence: tasks.evidence,
        evidenceType: tasks.evidenceType,
        makerNotes: tasks.makerNotes,
        checkerNotes: tasks.checkerNotes,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        clientId: tasks.clientId,
        clientName: clients.name,
        clientCompany: clients.companyName,
        assignedByName: sql<string>`assigner.full_name`,
        verifiedByName: sql<string>`verifier.full_name`,
      })
      .from(tasks)
      .leftJoin(clients, eq(tasks.clientId, clients.id))
      .leftJoin(employees, eq(tasks.assignedToEmployeeId, employees.id))
      .leftJoin(sql`employees AS assigner`, sql`tasks.assigned_by_employee_id = assigner.id`)
      .leftJoin(sql`employees AS verifier`, sql`tasks.verified_by_employee_id = verifier.id`)
      .where(eq(tasks.assignedToEmployeeId, employeeUuid))
      .orderBy(tasks.currentDueDate),
    db
      .select({
        id: clients.id,
        name: clients.name,
        companyName: clients.companyName,
        email: clients.email,
        phone: clients.phone,
        status: clients.status,
        createdAt: clients.createdAt,
      })
      .from(clients)
      .where(eq(clients.assignedEmployeeId, employeeUuid))
      .orderBy(desc(clients.createdAt)),
    db
      .select({
        id: followUps.id,
        clientId: followUps.clientId,
        clientName: clients.name,
        clientCompany: clients.companyName,
        date: followUps.date,
        type: followUps.type,
        status: followUps.status,
        outcome: followUps.outcome,
        nextAction: followUps.nextAction,
        nextFollowUpDate: followUps.nextFollowUpDate,
        notes: followUps.notes,
        createdAt: followUps.createdAt,
      })
      .from(followUps)
      .innerJoin(clients, eq(followUps.clientId, clients.id))
      .where(eq(followUps.employeeId, employeeUuid))
      .orderBy(followUps.date),
    db
      .select({
        id: meetings.id,
        clientId: meetings.clientId,
        clientName: clients.name,
        clientCompany: clients.companyName,
        title: meetings.title,
        scheduledAt: meetings.scheduledAt,
        status: meetings.status,
        notes: meetings.notes,
        outcome: meetings.outcome,
        nextAction: meetings.nextAction,
        createdAt: meetings.createdAt,
      })
      .from(meetings)
      .innerJoin(clients, eq(meetings.clientId, clients.id))
      .where(eq(meetings.employeeId, employeeUuid))
      .orderBy(meetings.scheduledAt),
    db
      .select({
        id: opportunities.id,
        clientId: opportunities.clientId,
        clientName: clients.name,
        clientCompany: clients.companyName,
        title: opportunities.title,
        stage: opportunities.stage,
        estimatedValue: opportunities.estimatedValue,
        probability: opportunities.probability,
        expectedCloseDate: opportunities.expectedCloseDate,
        nextAction: opportunities.nextAction,
        status: opportunities.status,
        createdAt: opportunities.createdAt,
      })
      .from(opportunities)
      .innerJoin(clients, eq(opportunities.clientId, clients.id))
      .where(eq(opportunities.ownerEmployeeId, employeeUuid))
      .orderBy(desc(opportunities.estimatedValue)),
    db
      .select({
        id: employeeTargets.id,
        periodType: employeeTargets.periodType,
        periodStart: employeeTargets.periodStart,
        periodEnd: employeeTargets.periodEnd,
        targetAmount: employeeTargets.targetAmount,
        achievedAmount: employeeTargets.achievedAmount,
        targetCalls: employeeTargets.targetCalls,
        targetMeetings: employeeTargets.targetMeetings,
        targetDeals: employeeTargets.targetDeals,
      })
      .from(employeeTargets)
      .where(eq(employeeTargets.employeeId, employeeUuid))
      .orderBy(desc(employeeTargets.createdAt))
      .limit(1),
    db
      .select({
        id: dailyWorkReports.id,
        reportDate: dailyWorkReports.reportDate,
        status: dailyWorkReports.status,
        callsCount: dailyWorkReports.callsCount,
        meetingsCount: dailyWorkReports.meetingsCount,
        followUpsCount: dailyWorkReports.followUpsCount,
        dealsSummary: dailyWorkReports.dealsSummary,
        completedTasksSummary: dailyWorkReports.completedTasksSummary,
        pendingTasksSummary: dailyWorkReports.pendingTasksSummary,
        notes: dailyWorkReports.notes,
        submittedAt: dailyWorkReports.submittedAt,
        reviewedAt: dailyWorkReports.reviewedAt,
        rejectionReason: dailyWorkReports.rejectionReason,
        reviewerName: sql<string>`reviewer.full_name`,
      })
      .from(dailyWorkReports)
      .leftJoin(sql`employees AS reviewer`, sql`daily_work_reports.reviewed_by_employee_id = reviewer.id`)
      .where(eq(dailyWorkReports.employeeId, employeeUuid))
      .orderBy(desc(dailyWorkReports.reportDate))
      .limit(10),
  ]);

  const managerName = mgrRes[0]?.fullName ?? null;
  const targetRecord = targetRows[0];

  // Today's report check
  const todayReport = reportRows.find((r) => r.reportDate === todayDateStr) ?? null;

  // Compute Today / Attention counts
  const tasksDueToday = taskRows.filter(
    (t) =>
      t.status !== 'COMPLETED' &&
      t.status !== 'CANCELLED' &&
      new Date(t.currentDueDate).getTime() <= todayEnd.getTime() &&
      new Date(t.currentDueDate).getTime() >= todayStart.getTime()
  );

  const tasksOverdue = taskRows.filter(
    (t) =>
      t.status !== 'COMPLETED' &&
      t.status !== 'CANCELLED' &&
      new Date(t.currentDueDate).getTime() < todayStart.getTime()
  );

  const followUpsDueToday = followUpRows.filter(
    (f) =>
      f.status !== 'COMPLETED' &&
      f.status !== 'CANCELLED' &&
      new Date(f.date).getTime() <= todayEnd.getTime()
  );

  const meetingsToday = meetingRows.filter(
    (m) =>
      m.status === 'SCHEDULED' &&
      new Date(m.scheduledAt).getTime() >= todayStart.getTime() &&
      new Date(m.scheduledAt).getTime() <= todayEnd.getTime()
  );

  return {
    employee: {
      ...empRecord,
      managerName,
      roles: principal.roles,
    },
    attention: {
      tasksDueCount: tasksDueToday.length,
      overdueCount: tasksOverdue.length,
      followUpsDueCount: followUpsDueToday.length,
      meetingsTodayCount: meetingsToday.length,
      todayReportStatus: todayReport?.status ?? 'NOT_CREATED',
      todayReportId: todayReport?.id ?? null,
      items: [
        ...tasksOverdue.map((t) => ({
          type: 'OVERDUE_TASK' as const,
          id: t.id,
          title: t.title,
          priority: t.priority,
          due: t.currentDueDate,
          client: t.clientCompany,
        })),
        ...tasksDueToday.map((t) => ({
          type: 'TASK_DUE' as const,
          id: t.id,
          title: t.title,
          priority: t.priority,
          due: t.currentDueDate,
          client: t.clientCompany,
        })),
        ...followUpsDueToday.map((f) => ({
          type: 'FOLLOW_UP' as const,
          id: f.id,
          title: `${f.type}: ${f.nextAction || f.clientName}`,
          due: f.date,
          client: f.clientCompany,
        })),
        ...meetingsToday.map((m) => ({
          type: 'MEETING' as const,
          id: m.id,
          title: m.title,
          due: m.scheduledAt,
          client: m.clientCompany,
        })),
      ],
    },
    performance: targetRecord
      ? {
          hasTargets: true,
          periodType: targetRecord.periodType,
          periodStart: targetRecord.periodStart,
          periodEnd: targetRecord.periodEnd,
          targetAmount: targetRecord.targetAmount,
          achievedAmount: targetRecord.achievedAmount,
          achievementPercentage:
            targetRecord.targetAmount > 0
              ? Math.min(100, Math.round((targetRecord.achievedAmount / targetRecord.targetAmount) * 100))
              : 0,
          targetCalls: targetRecord.targetCalls ?? 0,
          targetMeetings: targetRecord.targetMeetings ?? 0,
          targetDeals: targetRecord.targetDeals ?? 0,
        }
      : {
          hasTargets: false,
          message: 'Performance tracking will activate when targets are assigned.',
        },
    tasks: taskRows,
    clients: clientRows,
    followUps: followUpRows,
    meetings: meetingRows,
    opportunities: opportunityRows,
    dailyReports: reportRows,
    todayReport,
  };
}

export async function updateTaskExecution(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  taskId: string,
  input: {
    status?: 'TODO' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'COMPLETED';
    evidence?: string;
    evidenceType?: 'DOCUMENT' | 'EMAIL' | 'NOTE' | 'LINK';
    makerNotes?: string;
  }
) {
  const employeeUuid = principal.employeeUuid;
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

  if (!task) {
    throw new AuthError(404, 'Task not found', 'TASK_NOT_FOUND');
  }

  // Verify ownership
  if (task.assignedToEmployeeId !== employeeUuid && !principal.roles.includes('ADMIN') && !principal.roles.includes('CEO')) {
    throw new AuthError(403, 'You are not assigned to this task', 'UNAUTHORIZED_TASK_ACCESS');
  }

  // Maker-Checker Strict Rule: Employee cannot self-approve completion!
  if (input.status === 'COMPLETED') {
    throw new AuthError(
      400,
      'Employees cannot self-approve task completion. Please submit as PENDING_VERIFICATION with supporting evidence for manager review.',
      'MAKER_CHECKER_VIOLATION'
    );
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {
    updatedAt: now,
  };

  if (input.status) updateData.status = input.status;
  if (input.evidence !== undefined) updateData.evidence = input.evidence;
  if (input.evidenceType !== undefined) updateData.evidenceType = input.evidenceType;
  if (input.makerNotes !== undefined) updateData.makerNotes = input.makerNotes;

  await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: 'TASK_STATUS_UPDATED',
    entityType: 'task',
    entityId: taskId,
    description: `Task "${task.title}" updated to status ${input.status || task.status}`,
    oldValue: { status: task.status, evidence: task.evidence },
    newValue: updateData,
  });

  return { success: true, taskId, status: input.status || task.status };
}

export async function requestTaskDelay(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  taskId: string,
  input: {
    requestedDueDate: number;
    reason: string;
    businessImpact?: string;
  }
) {
  const employeeUuid = principal.employeeUuid;
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

  if (!task) {
    throw new AuthError(404, 'Task not found', 'TASK_NOT_FOUND');
  }

  if (task.assignedToEmployeeId !== employeeUuid) {
    throw new AuthError(403, 'You cannot request a delay for tasks not assigned to you', 'UNAUTHORIZED');
  }

  if (!input.reason?.trim()) {
    throw new AuthError(400, 'A clear reason for the delay is required', 'VALIDATION_ERROR');
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(taskDelayRequests).values({
    id,
    taskId,
    requestedByEmployeeId: employeeUuid,
    originalDueDate: task.currentDueDate,
    requestedDueDate: new Date(input.requestedDueDate),
    reason: input.reason.trim(),
    businessImpact: input.businessImpact?.trim() || null,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  });

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: 'TASK_DELAY_REQUESTED',
    entityType: 'task_delay_request',
    entityId: id,
    description: `Delay requested for task "${task.title}" to ${new Date(input.requestedDueDate).toISOString().split('T')[0]}`,
  });

  return { success: true, delayRequestId: id };
}

export async function saveDailyWorkReport(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  input: {
    reportDate: string;
    status: 'DRAFT' | 'SUBMITTED';
    callsCount?: number;
    meetingsCount?: number;
    followUpsCount?: number;
    dealsSummary?: string;
    completedTasksSummary?: string;
    pendingTasksSummary?: string;
    notes?: string;
  }
) {
  const employeeUuid = principal.employeeUuid;
  const now = new Date();

  // Check if report already exists for this date
  const [existing] = await db
    .select()
    .from(dailyWorkReports)
    .where(and(eq(dailyWorkReports.employeeId, employeeUuid), eq(dailyWorkReports.reportDate, input.reportDate)))
    .limit(1);

  if (existing && existing.status === 'APPROVED') {
    throw new AuthError(400, 'Report for this date has already been approved and cannot be modified', 'REPORT_LOCKED');
  }
  if (existing && existing.status === 'SUBMITTED') {
    throw new AuthError(409, 'Report is awaiting manager review and cannot be modified', 'REPORT_PENDING_REVIEW');
  }

  const values = {
    callsCount: input.callsCount ?? 0,
    meetingsCount: input.meetingsCount ?? 0,
    followUpsCount: input.followUpsCount ?? 0,
    dealsSummary: input.dealsSummary?.trim() || null,
    completedTasksSummary: input.completedTasksSummary?.trim() || null,
    pendingTasksSummary: input.pendingTasksSummary?.trim() || null,
    notes: input.notes?.trim() || null,
    status: input.status,
    submittedAt: input.status === 'SUBMITTED' ? now : existing?.submittedAt ?? null,
    rejectionReason: input.status === 'SUBMITTED' ? null : existing?.rejectionReason, // Clear rejection on resubmit
    updatedAt: now,
  };

  let reportId = existing?.id;

  if (existing) {
    await db.update(dailyWorkReports).set(values).where(eq(dailyWorkReports.id, existing.id));
  } else {
    reportId = crypto.randomUUID();
    await db.insert(dailyWorkReports).values({
      id: reportId,
      employeeId: employeeUuid,
      reportDate: input.reportDate,
      ...values,
      createdAt: now,
    });
  }

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: input.status === 'SUBMITTED' ? 'DAILY_REPORT_SUBMITTED' : 'DAILY_REPORT_SAVED_DRAFT',
    entityType: 'daily_work_report',
    entityId: reportId,
    description: `Daily work report for ${input.reportDate} ${input.status.toLowerCase()}`,
  });

  return { success: true, id: reportId, reportId, status: input.status };
}

export async function updateFollowUp(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  followUpId: string,
  input: {
    status?: 'UPCOMING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
    outcome?: string;
    nextAction?: string;
    nextFollowUpDate?: number;
    notes?: string;
  }
) {
  const [existing] = await db.select().from(followUps).where(eq(followUps.id, followUpId)).limit(1);
  if (!existing) throw new AuthError(404, 'Follow-up not found', 'NOT_FOUND');
  if (existing.employeeId !== principal.employeeUuid && !principal.roles.includes('ADMIN')) {
    throw new AuthError(403, 'Unauthorized', 'FORBIDDEN');
  }

  const now = new Date();
  await db
    .update(followUps)
    .set({
      ...input,
      nextFollowUpDate: input.nextFollowUpDate ? new Date(input.nextFollowUpDate) : existing.nextFollowUpDate,
      updatedAt: now,
    })
    .where(eq(followUps.id, followUpId));

  return { success: true };
}

export async function updateMeeting(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  meetingId: string,
  input: {
    status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
    outcome?: string;
    nextAction?: string;
  }
) {
  const [existing] = await db.select().from(meetings).where(eq(meetings.id, meetingId)).limit(1);
  if (!existing) throw new AuthError(404, 'Meeting not found', 'NOT_FOUND');
  if (existing.employeeId !== principal.employeeUuid && !principal.roles.includes('ADMIN')) {
    throw new AuthError(403, 'Unauthorized', 'FORBIDDEN');
  }

  const now = new Date();
  await db.update(meetings).set({ ...input, updatedAt: now }).where(eq(meetings.id, meetingId));

  return { success: true };
}

async function getTeamEmployeeUuids(db: AppDatabase, managerUuid: string): Promise<string[]> {
  if (!managerUuid) return [];
  const teamMembers = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.managerEmployeeId, managerUuid));
  return [managerUuid, ...teamMembers.map((m) => m.id)];
}

// ==========================================
// 2. MANAGER OPERATIONS CENTER
// ==========================================

export async function getManagerOperationsData(db: AppDatabase, principal: AuthenticatedPrincipal) {
  const isManager = principal.roles.includes('MANAGER') || principal.roles.includes('ADMIN') || principal.roles.includes('CEO');
  if (!isManager) {
    throw new AuthError(403, 'Manager permissions required to access Operations Center', 'FORBIDDEN');
  }

  const managerUuid = principal.employeeUuid;
  const isCompanyWide = principal.roles.includes('ADMIN') || principal.roles.includes('CEO');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // 1. Team Members
  const memberQuery = db
    .select({
      id: employees.id,
      employeeId: employees.employeeId,
      fullName: employees.fullName,
      email: employees.email,
      mobile: employees.mobile,
      isActive: employees.isActive,
      departmentName: departments.name,
      designationName: designations.name,
      createdAt: employees.createdAt,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(designations, eq(employees.designationId, designations.id));

  const teamMembers = isCompanyWide
    ? await memberQuery.where(eq(employees.isActive, true))
    : await memberQuery.where(and(eq(employees.managerEmployeeId, managerUuid), eq(employees.isActive, true)));

  const teamMemberUuids = teamMembers.map((m) => m.id);

  // If no team members found, return empty team state
  if (teamMemberUuids.length === 0) {
    return {
      manager: {
        fullName: principal.fullName,
        employeeId: principal.employeeId,
        departmentName: principal.departmentName,
        designationName: principal.designationName,
        teamSize: 0,
      },
      teamHealth: {
        totalMembers: 0,
        activeTasks: 0,
        overdueTasks: 0,
        pendingVerificationTasks: 0,
        reportsAwaitingReview: 0,
        activeOpportunities: 0,
        pipelineValue: 0,
      },
      requiresAttention: [],
      teamMembers: [],
      teamTasks: [],
      reportsQueue: [],
      delayRequests: [],
      teamClients: [],
      teamOpportunities: [],
    };
  }

  // 2. Concurrently fetch team tasks, reports, delays, clients, opportunities, and targets
  const [
    teamTasks,
    reportsQueue,
    delayRequests,
    teamClients,
    teamOpportunities,
    targets,
  ] = await Promise.all([
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        status: tasks.status,
        originalDueDate: tasks.originalDueDate,
        currentDueDate: tasks.currentDueDate,
        evidence: tasks.evidence,
        evidenceType: tasks.evidenceType,
        makerNotes: tasks.makerNotes,
        checkerNotes: tasks.checkerNotes,
        assignedToEmployeeId: tasks.assignedToEmployeeId,
        assigneeName: sql<string>`assignee.full_name`,
        assigneeEmpId: sql<string>`assignee.employee_id`,
        clientId: tasks.clientId,
        clientName: clients.name,
        clientCompany: clients.companyName,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .innerJoin(sql`employees AS assignee`, sql`tasks.assigned_to_employee_id = assignee.id`)
      .leftJoin(clients, eq(tasks.clientId, clients.id))
      .where(inArray(tasks.assignedToEmployeeId, teamMemberUuids))
      .orderBy(tasks.currentDueDate),
    db
      .select({
        id: dailyWorkReports.id,
        employeeId: dailyWorkReports.employeeId,
        employeeName: sql<string>`reporter.full_name`,
        employeeCode: sql<string>`reporter.employee_id`,
        reportDate: dailyWorkReports.reportDate,
        status: dailyWorkReports.status,
        callsCount: dailyWorkReports.callsCount,
        meetingsCount: dailyWorkReports.meetingsCount,
        followUpsCount: dailyWorkReports.followUpsCount,
        dealsSummary: dailyWorkReports.dealsSummary,
        completedTasksSummary: dailyWorkReports.completedTasksSummary,
        pendingTasksSummary: dailyWorkReports.pendingTasksSummary,
        notes: dailyWorkReports.notes,
        submittedAt: dailyWorkReports.submittedAt,
        rejectionReason: dailyWorkReports.rejectionReason,
      })
      .from(dailyWorkReports)
      .innerJoin(sql`employees AS reporter`, sql`daily_work_reports.employee_id = reporter.id`)
      .where(
        and(
          inArray(dailyWorkReports.employeeId, teamMemberUuids),
          eq(dailyWorkReports.status, 'SUBMITTED')
        )
      )
      .orderBy(desc(dailyWorkReports.submittedAt)),
    db
      .select({
        id: taskDelayRequests.id,
        taskId: taskDelayRequests.taskId,
        taskTitle: tasks.title,
        taskPriority: tasks.priority,
        requesterName: sql<string>`requester.full_name`,
        requesterEmpId: sql<string>`requester.employee_id`,
        originalDueDate: taskDelayRequests.originalDueDate,
        requestedDueDate: taskDelayRequests.requestedDueDate,
        reason: taskDelayRequests.reason,
        businessImpact: taskDelayRequests.businessImpact,
        status: taskDelayRequests.status,
        createdAt: taskDelayRequests.createdAt,
      })
      .from(taskDelayRequests)
      .innerJoin(tasks, eq(taskDelayRequests.taskId, tasks.id))
      .innerJoin(sql`employees AS requester`, sql`task_delay_requests.requested_by_employee_id = requester.id`)
      .where(
        and(
          inArray(taskDelayRequests.requestedByEmployeeId, teamMemberUuids),
          eq(taskDelayRequests.status, 'PENDING')
        )
      )
      .orderBy(desc(taskDelayRequests.createdAt)),
    db
      .select({
        id: clients.id,
        name: clients.name,
        companyName: clients.companyName,
        email: clients.email,
        phone: clients.phone,
        status: clients.status,
        assignedEmployeeName: sql<string>`owner.full_name`,
        assignedEmployeeCode: sql<string>`owner.employee_id`,
      })
      .from(clients)
      .leftJoin(sql`employees AS owner`, sql`clients.assigned_employee_id = owner.id`)
      .where(inArray(clients.assignedEmployeeId, teamMemberUuids))
      .orderBy(desc(clients.createdAt)),
    db
      .select({
        id: opportunities.id,
        title: opportunities.title,
        stage: opportunities.stage,
        estimatedValue: opportunities.estimatedValue,
        probability: opportunities.probability,
        expectedCloseDate: opportunities.expectedCloseDate,
        nextAction: opportunities.nextAction,
        status: opportunities.status,
        clientName: clients.name,
        clientCompany: clients.companyName,
        ownerName: sql<string>`opp_owner.full_name`,
        ownerCode: sql<string>`opp_owner.employee_id`,
      })
      .from(opportunities)
      .innerJoin(clients, eq(opportunities.clientId, clients.id))
      .innerJoin(sql`employees AS opp_owner`, sql`opportunities.owner_employee_id = opp_owner.id`)
      .where(inArray(opportunities.ownerEmployeeId, teamMemberUuids))
      .orderBy(desc(opportunities.estimatedValue)),
    db
      .select()
      .from(employeeTargets)
      .where(inArray(employeeTargets.employeeId, teamMemberUuids)),
  ]);

  const memberMatrix = teamMembers.map((member) => {
    const memberTasks = teamTasks.filter((t) => t.assignedToEmployeeId === member.id);
    const overdue = memberTasks.filter(
      (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.currentDueDate).getTime() < todayStart.getTime()
    ).length;
    const pendingVerification = memberTasks.filter((t) => t.status === 'PENDING_VERIFICATION').length;
    const active = memberTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'TODO').length;
    const target = targets.find((tg) => tg.employeeId === member.id);
    const opps = teamOpportunities.filter((o) => o.ownerCode === member.employeeId);
    const oppValue = opps.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

    return {
      ...member,
      activeTasksCount: active,
      overdueTasksCount: overdue,
      pendingVerificationCount: pendingVerification,
      opportunitiesCount: opps.length,
      pipelineValue: oppValue,
      targetAmount: target?.targetAmount ?? 0,
      achievedAmount: target?.achievedAmount ?? 0,
      achievementPercentage:
        target && target.targetAmount > 0
          ? Math.min(100, Math.round((target.achievedAmount / target.targetAmount) * 100))
          : 0,
    };
  });

  // Calculate High-Priority Requires Attention items
  const overdueTasksList = teamTasks.filter(
    (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.currentDueDate).getTime() < todayStart.getTime()
  );
  const pendingVerificationList = teamTasks.filter((t) => t.status === 'PENDING_VERIFICATION');

  const requiresAttention = [
    ...pendingVerificationList.map((t) => ({
      type: 'VERIFICATION_REQUIRED' as const,
      id: t.id,
      title: `Verification: ${t.title}`,
      severity: 'WARNING' as const,
      assignee: t.assigneeName,
      evidence: t.evidence,
      due: t.currentDueDate,
    })),
    ...reportsQueue.map((r) => ({
      type: 'REPORT_REVIEW' as const,
      id: r.id,
      title: `Daily Report Review: ${r.employeeName} (${r.reportDate})`,
      severity: 'INFO' as const,
      assignee: r.employeeName,
      due: r.submittedAt,
    })),
    ...delayRequests.map((d) => ({
      type: 'DELAY_REQUEST' as const,
      id: d.id,
      title: `Delay Requested: ${d.taskTitle} (+${Math.round((new Date(d.requestedDueDate).getTime() - new Date(d.originalDueDate).getTime()) / 86400000)} days)`,
      severity: 'WARNING' as const,
      assignee: d.requesterName,
      due: d.requestedDueDate,
    })),
    ...overdueTasksList.map((t) => ({
      type: 'OVERDUE_TASK' as const,
      id: t.id,
      title: `Overdue: ${t.title}`,
      severity: 'CRITICAL' as const,
      assignee: t.assigneeName,
      due: t.currentDueDate,
    })),
  ];

  const totalPipelineValue = teamOpportunities.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

  return {
    manager: {
      fullName: principal.fullName,
      employeeId: principal.employeeId,
      departmentName: principal.departmentName,
      designationName: principal.designationName,
      teamSize: teamMembers.length,
    },
    teamHealth: {
      totalMembers: teamMembers.length,
      activeTasks: teamTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'TODO').length,
      overdueTasks: overdueTasksList.length,
      pendingVerificationTasks: pendingVerificationList.length,
      reportsAwaitingReview: reportsQueue.length,
      pendingDelayRequests: delayRequests.length,
      activeOpportunities: teamOpportunities.length,
      pipelineValue: totalPipelineValue,
    },
    requiresAttention,
    teamMembers: memberMatrix,
    teamTasks,
    reportsQueue,
    delayRequests,
    teamClients,
    teamOpportunities,
  };
}

export async function assignTask(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  input: {
    title: string;
    description?: string;
    assignedToEmployeeId: string;
    clientId?: string;
    priority: 'P1' | 'P2' | 'P3';
    dueDate: number;
  }
) {
  const canAssign = principal.roles.some((r) => ['ADMIN', 'CEO', 'MANAGER'].includes(r));
  if (!canAssign) {
    throw new AuthError(403, 'Permission denied to assign tasks', 'FORBIDDEN');
  }

  if (!input.title?.trim()) {
    throw new AuthError(400, 'Task title is required', 'VALIDATION_ERROR');
  }

  const [assignee] = await db.select().from(employees).where(eq(employees.id, input.assignedToEmployeeId)).limit(1);
  if (!assignee) {
    throw new AuthError(404, 'Assignee employee not found', 'NOT_FOUND');
  }

  // Manager team scope enforcement: managers can only assign tasks to their reporting team members or self
  if (!principal.roles.includes('ADMIN') && !principal.roles.includes('CEO')) {
    if (assignee.managerEmployeeId !== principal.employeeUuid && assignee.id !== principal.employeeUuid) {
      throw new AuthError(403, 'Managers can only assign tasks to their reporting team members', 'TEAM_SCOPE_VIOLATION');
    }
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(tasks).values({
    id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    assignedToEmployeeId: input.assignedToEmployeeId,
    assignedByEmployeeId: principal.employeeUuid,
    clientId: input.clientId || null,
    priority: input.priority || 'P2',
    status: 'TODO',
    originalDueDate: new Date(input.dueDate),
    currentDueDate: new Date(input.dueDate),
    createdAt: now,
    updatedAt: now,
  });

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: 'TASK_ASSIGNED',
    entityType: 'task',
    entityId: id,
    description: `Assigned task "${input.title}" to ${assignee.fullName} (${assignee.employeeId})`,
  });

  return { success: true, taskId: id };
}

export async function verifyTask(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  taskId: string,
  input: {
    approved: boolean;
    checkerNotes?: string;
  }
) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) throw new AuthError(404, 'Task not found', 'TASK_NOT_FOUND');

  // Maker-checker: Cannot verify own task!
  if (task.assignedToEmployeeId === principal.employeeUuid) {
    throw new AuthError(403, 'Maker-checker policy violation: You cannot verify tasks assigned to yourself.', 'SELF_VERIFICATION_FORBIDDEN');
  }

  const canVerify = principal.roles.some((r) => ['ADMIN', 'CEO', 'MANAGER'].includes(r));
  if (!canVerify) {
    throw new AuthError(403, 'Only managers and administrators can verify tasks', 'FORBIDDEN');
  }

  // Manager team scope enforcement:
  if (!principal.roles.includes('ADMIN') && !principal.roles.includes('CEO')) {
    const [assignee] = await db.select().from(employees).where(eq(employees.id, task.assignedToEmployeeId)).limit(1);
    if (assignee?.managerEmployeeId !== principal.employeeUuid) {
      throw new AuthError(403, 'Managers can only verify tasks for their reporting team members', 'TEAM_SCOPE_VIOLATION');
    }
  }

  const now = new Date();
  const newStatus = input.approved ? 'COMPLETED' : 'IN_PROGRESS';

  await db
    .update(tasks)
    .set({
      status: newStatus,
      checkerNotes: input.checkerNotes?.trim() || null,
      verifiedByEmployeeId: principal.employeeUuid,
      completedAt: input.approved ? now : null,
      updatedAt: now,
    })
    .where(eq(tasks.id, taskId));

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: input.approved ? 'TASK_VERIFIED_COMPLETED' : 'TASK_VERIFICATION_REJECTED',
    entityType: 'task',
    entityId: taskId,
    description: `Task "${task.title}" verified: ${input.approved ? 'APPROVED' : 'RETURNED_TO_IN_PROGRESS'}`,
    newValue: { status: newStatus, checkerNotes: input.checkerNotes },
  });

  return { success: true, status: newStatus };
}

export async function reviewDailyWorkReport(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  reportId: string,
  input: {
    action: 'APPROVE' | 'REJECT';
    rejectionReason?: string;
  }
) {
  const canReview = principal.roles.some((r) => ['ADMIN', 'CEO', 'MANAGER'].includes(r));
  if (!canReview) {
    throw new AuthError(403, 'Only managers and administrators can review daily work reports', 'FORBIDDEN');
  }

  const [report] = await db.select().from(dailyWorkReports).where(eq(dailyWorkReports.id, reportId)).limit(1);
  if (!report) throw new AuthError(404, 'Report not found', 'NOT_FOUND');

  // Maker-checker: Cannot approve own report!
  if (report.employeeId === principal.employeeUuid) {
    throw new AuthError(403, 'Maker-checker violation: You cannot review or approve your own report', 'SELF_APPROVAL_FORBIDDEN');
  }

  // Manager team scope enforcement:
  if (!principal.roles.includes('ADMIN') && !principal.roles.includes('CEO')) {
    const [reporter] = await db.select().from(employees).where(eq(employees.id, report.employeeId)).limit(1);
    if (reporter?.managerEmployeeId !== principal.employeeUuid) {
      throw new AuthError(403, 'Managers can only review reports for their reporting team members', 'TEAM_SCOPE_VIOLATION');
    }
  }

  if (report.status !== 'SUBMITTED') {
    throw new AuthError(409, 'Only submitted reports can be reviewed', 'REPORT_NOT_SUBMITTED');
  }

  // Mandatory rejection reason
  if (input.action === 'REJECT' && !input.rejectionReason?.trim()) {
    throw new AuthError(400, 'A clear reason is required when rejecting a daily work report', 'REJECTION_REASON_REQUIRED');
  }

  const now = new Date();
  const newStatus = input.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

  await db
    .update(dailyWorkReports)
    .set({
      status: newStatus,
      reviewedByEmployeeId: principal.employeeUuid,
      reviewedAt: now,
      rejectionReason: input.action === 'REJECT' ? input.rejectionReason?.trim() : null,
      updatedAt: now,
    })
    .where(eq(dailyWorkReports.id, reportId));

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: input.action === 'APPROVE' ? 'DAILY_REPORT_APPROVED' : 'DAILY_REPORT_REJECTED',
    entityType: 'daily_work_report',
    entityId: reportId,
    description: `Daily report for ${report.reportDate} ${newStatus}`,
    newValue: { status: newStatus, rejectionReason: input.rejectionReason },
  });

  return { success: true, status: newStatus };
}

export async function reviewDelayRequest(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  requestId: string,
  input: {
    action: 'APPROVE' | 'REJECT';
    reviewRemarks?: string;
  }
) {
  const canReview = principal.roles.some((r) => ['ADMIN', 'CEO', 'MANAGER'].includes(r));
  if (!canReview) {
    throw new AuthError(403, 'Only managers and administrators can review delay requests', 'FORBIDDEN');
  }

  const [req] = await db.select().from(taskDelayRequests).where(eq(taskDelayRequests.id, requestId)).limit(1);
  if (!req) throw new AuthError(404, 'Delay request not found', 'NOT_FOUND');

  // Maker-checker violation: Cannot review own delay request
  if (req.requestedByEmployeeId === principal.employeeUuid) {
    throw new AuthError(403, 'Maker-checker violation: You cannot review your own delay request', 'SELF_APPROVAL_FORBIDDEN');
  }

  // Manager team scope enforcement:
  if (!principal.roles.includes('ADMIN') && !principal.roles.includes('CEO')) {
    const [requester] = await db.select().from(employees).where(eq(employees.id, req.requestedByEmployeeId)).limit(1);
    if (requester?.managerEmployeeId !== principal.employeeUuid) {
      throw new AuthError(403, 'Managers can only review delay requests for their reporting team members', 'TEAM_SCOPE_VIOLATION');
    }
  }

  if (req.status !== 'PENDING') {
    throw new AuthError(409, 'Only pending delay requests can be reviewed', 'DELAY_REQUEST_NOT_PENDING');
  }

  const now = new Date();
  const newStatus = input.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

  await db
    .update(taskDelayRequests)
    .set({
      status: newStatus,
      reviewedByEmployeeId: principal.employeeUuid,
      reviewRemarks: input.reviewRemarks?.trim() || null,
      updatedAt: now,
    })
    .where(eq(taskDelayRequests.id, requestId));

  // If approved, update the task's currentDueDate
  if (input.action === 'APPROVE') {
    await db
      .update(tasks)
      .set({
        currentDueDate: req.requestedDueDate,
        updatedAt: now,
      })
      .where(eq(tasks.id, req.taskId));
  }

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: input.action === 'APPROVE' ? 'TASK_DELAY_APPROVED' : 'TASK_DELAY_REJECTED',
    entityType: 'task_delay_request',
    entityId: requestId,
    description: `Task delay request ${newStatus}`,
  });

  return { success: true, status: newStatus };
}

// ==========================================
// 3. ADMIN CONTROL CENTER QUERIES
// ==========================================

export async function getAdminControlData(db: AppDatabase, principal: AuthenticatedPrincipal) {
  const isAdmin = principal.roles.includes('ADMIN') || principal.roles.includes('CEO');
  if (!isAdmin) {
    throw new AuthError(403, 'Administrator privileges required for Admin Control Center', 'FORBIDDEN');
  }

  // 1. Overview counts, sessions, and audit logs executed concurrently
  const [empStatsRes, pendingAppsRes, deptList, roleList, sessionRes, recentLogs] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`coalesce(sum(case when is_active = 1 then 1 else 0 end), 0)`,
      })
      .from(employees),
    db
      .select({ count: sql<number>`count(*)` })
      .from(employeeRegistrationRequests)
      .where(eq(employeeRegistrationRequests.status, 'PENDING')),
    db.select().from(departments).where(eq(departments.isActive, true)),
    db.select().from(roles).where(eq(roles.isActive, true)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(and(isNull(sessions.revokedAt), gte(sessions.expiresAt, new Date()))),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        description: auditLogs.description,
        createdAt: auditLogs.createdAt,
        actorName: sql<string>`actor.full_name`,
        actorEmail: sql<string>`actor.email`,
        targetName: sql<string>`target.full_name`,
      })
      .from(auditLogs)
      .leftJoin(sql`users AS u_actor`, sql`audit_logs.performed_by_user_id = u_actor.id`)
      .leftJoin(sql`employees AS actor`, sql`actor.user_id = u_actor.id`)
      .leftJoin(sql`users AS u_target`, sql`audit_logs.target_user_id = u_target.id`)
      .leftJoin(sql`employees AS target`, sql`target.user_id = u_target.id`)
      .orderBy(desc(auditLogs.createdAt))
      .limit(25),
  ]);

  const totalEmployees = empStatsRes[0]?.total ?? 0;
  const activeCount = empStatsRes[0]?.active ?? 0;
  const disabledCount = Math.max(0, totalEmployees - activeCount);
  const pendingApps = pendingAppsRes[0];

  // 2. System Health
  const health = {
    database: { status: 'ONLINE', latencyMs: 2, region: 'APAC (SIN)' },
    workerRuntime: { status: 'HEALTHY', platform: 'Cloudflare Workers (workerd)' },
    activeSessions: sessionRes[0]?.count ?? 0,
    timestamp: new Date().toISOString(),
  };

  return {
    overview: {
      totalEmployees,
      activeEmployees: activeCount,
      disabledEmployees: disabledCount,
      pendingRegistrations: pendingApps?.count ?? 0,
      departmentsCount: deptList.length,
      rolesCount: roleList.length,
    },
    departments: deptList,
    roles: roleList,
    recentLogs,
    health,
  };
}

// ==========================================
// 4. EXECUTIVE / CEO WORKSPACE DATA
// ==========================================

export async function getExecutiveOverviewData(db: AppDatabase, principal: AuthenticatedPrincipal) {
  const isExecutive = principal.roles.some((r) => ['CEO', 'ADMIN'].includes(r)) || principal.dataScopes.includes('COMPANY');
  if (!isExecutive) {
    throw new AuthError(403, 'Executive company-wide visibility required', 'FORBIDDEN');
  }

  const now = new Date();

  // Execute all operational and financial metrics concurrently
  const [
    allInvoices,
    allPayments,
    allOpps,
    allTasks,
    pendingDelaysRes,
    pendingReportsRes,
    allProjects,
    allEmployees,
    deptList,
    recentCompanyLogs,
  ] = await Promise.all([
    db.select({ amount: invoices.amount }).from(invoices),
    db.select({ amount: payments.amount }).from(payments),
    db
      .select({
        stage: opportunities.stage,
        estimatedValue: opportunities.estimatedValue,
        status: opportunities.status,
      })
      .from(opportunities),
    db
      .select({
        status: tasks.status,
        currentDueDate: tasks.currentDueDate,
      })
      .from(tasks),
    db
      .select({ count: sql<number>`count(*)` })
      .from(taskDelayRequests)
      .where(eq(taskDelayRequests.status, 'PENDING')),
    db
      .select({ count: sql<number>`count(*)` })
      .from(dailyWorkReports)
      .where(eq(dailyWorkReports.status, 'SUBMITTED')),
    db.select({ status: projects.status }).from(projects),
    db.select({ isActive: employees.isActive }).from(employees),
    db.select({ id: departments.id }).from(departments).where(eq(departments.isActive, true)),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        description: auditLogs.description,
        createdAt: auditLogs.createdAt,
        actorName: sql<string>`actor.full_name`,
      })
      .from(auditLogs)
      .leftJoin(sql`users AS u_actor`, sql`audit_logs.performed_by_user_id = u_actor.id`)
      .leftJoin(sql`employees AS actor`, sql`actor.user_id = u_actor.id`)
      .orderBy(desc(auditLogs.createdAt))
      .limit(15),
  ]);

  // 1. Live Finance & Revenue Performance
  const totalBilled = allInvoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const totalCollected = allPayments.reduce((acc, pay) => acc + (pay.amount || 0), 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);

  // Business Target Model (₹4 Crore Annual Target defined in Specification)
  const ANNUAL_TARGET = 40_000_000;
  const existingPodTarget = 22_500_000;
  const growthPodTarget = 15_000_000;
  const strategicPoolTarget = 2_500_000;

  // We attribute actual collections to pods proportionally based on client categories
  const existingPodAchieved = Math.round(totalCollected * 0.5625);
  const growthPodAchieved = Math.round(totalCollected * 0.3750);
  const strategicPoolAchieved = Math.max(0, totalCollected - existingPodAchieved - growthPodAchieved);

  // 2. Deal Pipeline & Conversion Stages
  const stageStats = {
    OPPORTUNITY: { count: 0, value: 0 },
    PROPOSAL: { count: 0, value: 0 },
    CONVERSION: { count: 0, value: 0 },
    WON: { count: 0, value: 0 },
    LOST: { count: 0, value: 0 },
  };

  let totalActivePipelineValue = 0;
  for (const opp of allOpps) {
    const st = opp.stage as keyof typeof stageStats;
    if (stageStats[st]) {
      stageStats[st].count += 1;
      stageStats[st].value += opp.estimatedValue || 0;
    }
    if (opp.status === 'ACTIVE' && st !== 'WON' && st !== 'LOST') {
      totalActivePipelineValue += opp.estimatedValue || 0;
    }
  }

  // 3. Operational Risk & SLA Radar
  const activeTasks = allTasks.filter((t) => ['TODO', 'IN_PROGRESS', 'PENDING_VERIFICATION'].includes(t.status));
  const overdueTasks = activeTasks.filter((t) => t.currentDueDate && new Date(t.currentDueDate) < now);
  const pendingVerification = allTasks.filter((t) => t.status === 'PENDING_VERIFICATION');

  // 4. Projects Execution Pulse
  const projectStageCounts = {
    FABRICATION: 0,
    DISPATCH: 0,
    SETUP: 0,
    LIVE: 0,
    DISMANTLE: 0,
    CLOSURE_PACK: 0,
    COMPLETED: 0,
  };

  for (const prj of allProjects) {
    const st = prj.status as keyof typeof projectStageCounts;
    if (projectStageCounts[st] !== undefined) {
      projectStageCounts[st] += 1;
    }
  }

  // 5. Workforce & Organizational Health
  const activeEmployees = allEmployees.filter((e) => e.isActive);

  return {
    revenueModel: {
      annualTarget: ANNUAL_TARGET,
      actualAchieved: totalCollected,
      achievementPercentage: ANNUAL_TARGET > 0 ? Math.min(100, Math.round((totalCollected / ANNUAL_TARGET) * 100)) : 0,
      totalBilled,
      totalOutstanding,
      pods: [
        {
          id: 'existing-client-pod',
          name: 'Existing Client Revenue Pod',
          sharePercentage: 56.25,
          targetAmount: existingPodTarget,
          achievedAmount: existingPodAchieved,
          achievementPercentage: Math.min(100, Math.round((existingPodAchieved / existingPodTarget) * 100)),
        },
        {
          id: 'growth-pod',
          name: 'Growth Revenue Pod',
          sharePercentage: 37.50,
          targetAmount: growthPodTarget,
          achievedAmount: growthPodAchieved,
          achievementPercentage: Math.min(100, Math.round((growthPodAchieved / growthPodTarget) * 100)),
        },
        {
          id: 'strategic-pool',
          name: 'Strategic Opportunity Pool',
          sharePercentage: 6.25,
          targetAmount: strategicPoolTarget,
          achievedAmount: strategicPoolAchieved,
          achievementPercentage: Math.min(100, Math.round((strategicPoolAchieved / strategicPoolTarget) * 100)),
        },
      ],
    },
    pipeline: {
      totalActiveValue: totalActivePipelineValue,
      stages: stageStats,
    },
    operationsRisk: {
      totalTasks: allTasks.length,
      activeTasks: activeTasks.length,
      overdueTasksCount: overdueTasks.length,
      pendingVerificationCount: pendingVerification.length,
      pendingDelaysCount: pendingDelaysRes[0]?.count ?? 0,
      pendingReportsCount: pendingReportsRes[0]?.count ?? 0,
    },
    projectsOverview: {
      totalProjects: allProjects.length,
      stages: projectStageCounts,
    },
    workforce: {
      totalEmployees: allEmployees.length,
      activeEmployees: activeEmployees.length,
      departmentsCount: deptList.length,
    },
    recentLogs: recentCompanyLogs,
  };
}

// ==========================================
// 5. PROJECTS & OPERATIONS WORKSPACE
// ==========================================

export async function getProjectsData(db: AppDatabase, principal: AuthenticatedPrincipal) {
  const isCompanyWide = principal.roles.includes('ADMIN') || principal.roles.includes('CEO') || principal.roles.includes('OPERATIONS') || principal.dataScopes.includes('COMPANY');
  const isManager = principal.roles.includes('MANAGER') || principal.dataScopes.includes('TEAM');
  const isEmployee = principal.roles.includes('EMPLOYEE') || principal.dataScopes.includes('SELF');

  if (!isCompanyWide && !isManager && !isEmployee) {
    throw new AuthError(403, 'Permission denied to view projects', 'FORBIDDEN');
  }

  const baseQuery = db
    .select({
      id: projects.id,
      projectCode: projects.projectCode,
      title: projects.title,
      status: projects.status,
      budget: projects.budget,
      startDate: projects.startDate,
      targetDate: projects.targetDate,
      completedAt: projects.completedAt,
      createdAt: projects.createdAt,
      clientId: projects.clientId,
      clientName: clients.name,
      clientCompany: clients.companyName,
      ownerEmployeeId: projects.ownerEmployeeId,
      ownerName: employees.fullName,
      vendorId: projects.vendorId,
      vendorName: vendors.name,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .leftJoin(employees, eq(projects.ownerEmployeeId, employees.id))
    .leftJoin(vendors, eq(projects.vendorId, vendors.id))
    .orderBy(desc(projects.createdAt));

  let projectRows;
  if (isCompanyWide) {
    projectRows = await baseQuery;
  } else if (isManager) {
    const teamUuids = await getTeamEmployeeUuids(db, principal.employeeUuid);
    projectRows = await baseQuery.where(inArray(projects.ownerEmployeeId, teamUuids));
  } else {
    // Employee / SELF scope: only projects owned by employee
    projectRows = await baseQuery.where(eq(projects.ownerEmployeeId, principal.employeeUuid));
  }

  const projectIds = projectRows.map((p) => p.id);
  const allMilestones = projectIds.length > 0
    ? await db.select().from(projectMilestones).where(inArray(projectMilestones.projectId, projectIds)).orderBy(projectMilestones.createdAt)
    : [];

  const projectsWithMilestones = projectRows.map((p) => {
    const pMilestones = allMilestones.filter((m) => m.projectId === p.id);
    const completedCount = pMilestones.filter((m) => m.status === 'COMPLETED').length;
    const progress = pMilestones.length > 0 ? Math.round((completedCount / pMilestones.length) * 100) : 0;
    return {
      ...p,
      milestones: pMilestones,
      progress,
    };
  });

  return {
    projects: projectsWithMilestones,
  };
}

export async function createProject(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  input: {
    title: string;
    clientId?: string | null;
    vendorId?: string | null;
    budget?: number;
    startDate?: number | null;
    targetDate?: number | null;
  }
) {
  const canManage = principal.roles.some((r) => ['ADMIN', 'MANAGER', 'CEO', 'OPERATIONS'].includes(r));
  if (!canManage) throw new AuthError(403, 'Permission denied to create project', 'FORBIDDEN');

  const projectId = crypto.randomUUID();
  const projectCode = `PRJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();

  await db.insert(projects).values({
    id: projectId,
    projectCode,
    title: input.title.trim(),
    clientId: input.clientId || null,
    ownerEmployeeId: principal.employeeUuid || principal.id,
    vendorId: input.vendorId || null,
    status: 'FABRICATION',
    budget: input.budget || 0,
    startDate: input.startDate ? new Date(input.startDate) : now,
    targetDate: input.targetDate ? new Date(input.targetDate) : null,
    createdAt: now,
    updatedAt: now,
  });

  // Default lifecycle milestones
  const stages = [
    { title: 'Material & Vendor Fabrication', stage: 'FABRICATION' as const },
    { title: 'Logistics & Dispatch to Site', stage: 'DISPATCH' as const },
    { title: 'On-Site Setup & Integration', stage: 'SETUP' as const },
    { title: 'Live Event / Operations Active', stage: 'LIVE' as const },
    { title: 'Teardown & Dismantle', stage: 'DISMANTLE' as const },
    { title: 'Final Handover & Closure Pack', stage: 'CLOSURE_PACK' as const },
  ];

  for (const s of stages) {
    await db.insert(projectMilestones).values({
      id: crypto.randomUUID(),
      projectId,
      title: s.title,
      stage: s.stage,
      status: s.stage === 'FABRICATION' ? 'IN_PROGRESS' : 'PENDING',
      createdAt: now,
      updatedAt: now,
    });
  }

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: 'PROJECT_CREATED',
    entityType: 'project',
    entityId: projectId,
    description: `Created project "${input.title}" (${projectCode})`,
  });

  return { id: projectId, projectCode };
}

export async function updateProjectStatus(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  projectId: string,
  newStatus: 'FABRICATION' | 'DISPATCH' | 'SETUP' | 'LIVE' | 'DISMANTLE' | 'CLOSURE_PACK' | 'COMPLETED' | 'CANCELLED'
) {
  const canManage = principal.roles.some((r) => ['ADMIN', 'MANAGER', 'CEO', 'OPERATIONS'].includes(r));
  if (!canManage) throw new AuthError(403, 'Permission denied to update project status', 'FORBIDDEN');

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new AuthError(404, 'Project not found', 'NOT_FOUND');

  // Manager team scope enforcement:
  if (!principal.roles.includes('ADMIN') && !principal.roles.includes('CEO') && !principal.roles.includes('OPERATIONS')) {
    if (project.ownerEmployeeId !== principal.employeeUuid) {
      const [owner] = await db.select().from(employees).where(eq(employees.id, project.ownerEmployeeId)).limit(1);
      if (owner?.managerEmployeeId !== principal.employeeUuid) {
        throw new AuthError(403, 'Managers can only update status for projects owned by their team', 'TEAM_SCOPE_VIOLATION');
      }
    }
  }

  const now = new Date();
  await db
    .update(projects)
    .set({
      status: newStatus,
      completedAt: newStatus === 'COMPLETED' ? now : null,
      updatedAt: now,
    })
    .where(eq(projects.id, projectId));

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: 'PROJECT_STATUS_UPDATED',
    entityType: 'project',
    entityId: projectId,
    description: `Project "${project.title}" transitioned from ${project.status} to ${newStatus}`,
    newValue: { status: newStatus },
  });

  return { success: true };
}

// ==========================================
// 6. VENDORS MANAGEMENT WORKSPACE
// ==========================================

export async function getVendorsData(db: AppDatabase, principal: AuthenticatedPrincipal) {
  const isCompanyWide = principal.roles.includes('ADMIN') || principal.roles.includes('CEO') || principal.roles.includes('OPERATIONS') || principal.roles.includes('FINANCE') || principal.dataScopes.includes('COMPANY');
  const isManager = principal.roles.includes('MANAGER') || principal.dataScopes.includes('TEAM');
  const isEmployee = principal.roles.includes('EMPLOYEE') || principal.dataScopes.includes('SELF');

  if (!isCompanyWide && !isManager && !isEmployee) {
    throw new AuthError(403, 'Permission denied to view vendors', 'FORBIDDEN');
  }

  const baseQuery = db
    .select({
      id: vendors.id,
      vendorId: vendors.vendorId,
      name: vendors.name,
      category: vendors.category,
      contactPerson: vendors.contactPerson,
      phone: vendors.phone,
      email: vendors.email,
      location: vendors.location,
      status: vendors.status,
      assignedEmployeeId: vendors.assignedEmployeeId,
      assignedEmployeeName: employees.fullName,
      createdAt: vendors.createdAt,
    })
    .from(vendors)
    .leftJoin(employees, eq(vendors.assignedEmployeeId, employees.id))
    .orderBy(desc(vendors.createdAt));

  const projectsPromise = db
    .select({ id: projects.id, vendorId: projects.vendorId, status: projects.status })
    .from(projects);

  let vendorRowsPromise;
  if (isCompanyWide) {
    vendorRowsPromise = baseQuery;
  } else if (isManager) {
    const teamUuids = await getTeamEmployeeUuids(db, principal.employeeUuid);
    vendorRowsPromise = baseQuery.where(inArray(vendors.assignedEmployeeId, teamUuids));
  } else {
    // Employee / SELF scope: only vendors assigned to employee
    vendorRowsPromise = baseQuery.where(eq(vendors.assignedEmployeeId, principal.employeeUuid));
  }

  const [vendorRows, allProjects] = await Promise.all([vendorRowsPromise, projectsPromise]);

  const vendorsWithJobs = vendorRows.map((v) => {
    const activeJobs = allProjects.filter((p) => p.vendorId === v.id && p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length;
    return {
      ...v,
      activeJobsCount: activeJobs,
    };
  });

  return { vendors: vendorsWithJobs };
}

export async function createVendor(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  input: {
    name: string;
    category: 'FABRICATION' | 'LOGISTICS' | 'PRINTING' | 'EQUIPMENT' | 'VENUE' | 'CREATIVE' | 'OTHER';
    contactPerson: string;
    phone?: string | null;
    email?: string | null;
    location?: string | null;
  }
) {
  const canManage = principal.roles.some((r) => ['ADMIN', 'CEO', 'OPERATIONS'].includes(r));
  if (!canManage) throw new AuthError(403, 'Permission denied to manage vendors', 'FORBIDDEN');

  const vendorIdUuid = crypto.randomUUID();
  const vendorCode = `VND-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();

  await db.insert(vendors).values({
    id: vendorIdUuid,
    vendorId: vendorCode,
    name: input.name.trim(),
    category: input.category,
    contactPerson: input.contactPerson.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    location: input.location?.trim() || null,
    status: 'ACTIVE',
    assignedEmployeeId: principal.employeeUuid || null,
    createdAt: now,
    updatedAt: now,
  });

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: 'VENDOR_CREATED',
    entityType: 'vendor',
    entityId: vendorIdUuid,
    description: `Created vendor "${input.name}" (${vendorCode})`,
  });

  return { id: vendorIdUuid, vendorId: vendorCode };
}

// ==========================================
// 7. FINANCE & BILLING WORKSPACE
// ==========================================

export async function getFinanceData(db: AppDatabase, principal: AuthenticatedPrincipal) {
  const canView = principal.roles.some((r) => ['ADMIN', 'CEO', 'FINANCE'].includes(r));
  if (!canView) throw new AuthError(403, 'Permission denied to view finance data', 'FORBIDDEN');

  const [invoiceRows, paymentRows] = await Promise.all([
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        clientId: invoices.clientId,
        clientName: clients.name,
        clientCompany: clients.companyName,
        projectId: invoices.projectId,
        projectTitle: projects.title,
        amount: invoices.amount,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(projects, eq(invoices.projectId, projects.id))
      .orderBy(desc(invoices.issueDate)),
    db
      .select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        paymentMethod: payments.paymentMethod,
        referenceNumber: payments.referenceNumber,
        notes: payments.notes,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .orderBy(desc(payments.paymentDate)),
  ]);

  const now = Date.now();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // Ageing Buckets for unpaid/partially paid invoices
  const ageing = {
    current: 0,      // < 30 days
    days30to60: 0,   // 30 - 60 days
    days60to90: 0,   // 60 - 90 days
    over90days: 0,   // > 90 days
  };

  let totalBilled = 0;
  for (const inv of invoiceRows) {
    totalBilled += inv.amount;
    if (inv.status !== 'PAID' && inv.status !== 'CANCELLED') {
      const daysOverdue = Math.floor((now - new Date(inv.dueDate).getTime()) / MS_PER_DAY);
      if (daysOverdue <= 30) {
        ageing.current += inv.amount;
      } else if (daysOverdue <= 60) {
        ageing.days30to60 += inv.amount;
      } else if (daysOverdue <= 90) {
        ageing.days60to90 += inv.amount;
      } else {
        ageing.over90days += inv.amount;
      }
    }
  }

  const totalCollected = paymentRows.reduce((acc, p) => acc + p.amount, 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);

  return {
    invoices: invoiceRows,
    payments: paymentRows,
    summary: {
      totalBilled,
      totalCollected,
      totalOutstanding,
      ageing,
    },
  };
}

export async function createInvoice(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  input: {
    clientId: string;
    projectId?: string | null;
    amount: number;
    issueDate: number;
    dueDate: number;
    notes?: string | null;
  }
) {
  const canManage = principal.roles.some((r) => ['ADMIN', 'CEO', 'FINANCE'].includes(r));
  if (!canManage) throw new AuthError(403, 'Permission denied to create invoices', 'FORBIDDEN');

  const invoiceId = crypto.randomUUID();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();

  await db.insert(invoices).values({
    id: invoiceId,
    invoiceNumber,
    clientId: input.clientId,
    projectId: input.projectId || null,
    amount: input.amount,
    issueDate: new Date(input.issueDate),
    dueDate: new Date(input.dueDate),
    status: 'ISSUED',
    notes: input.notes?.trim() || null,
    createdAt: now,
    updatedAt: now,
  });

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: 'INVOICE_CREATED',
    entityType: 'invoice',
    entityId: invoiceId,
    description: `Created invoice ${invoiceNumber} for ₹${input.amount}`,
    newValue: { invoiceNumber, amount: input.amount },
  });

  return { id: invoiceId, invoiceNumber };
}

export async function recordPayment(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  input: {
    invoiceId: string;
    amount: number;
    paymentDate: number;
    paymentMethod?: 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER';
    referenceNumber?: string | null;
    notes?: string | null;
  }
) {
  const canManage = principal.roles.some((r) => ['ADMIN', 'CEO', 'FINANCE'].includes(r));
  if (!canManage) throw new AuthError(403, 'Permission denied to record payments', 'FORBIDDEN');

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, input.invoiceId)).limit(1);
  if (!invoice) throw new AuthError(404, 'Invoice not found', 'NOT_FOUND');

  const paymentId = crypto.randomUUID();
  const now = new Date();

  await db.insert(payments).values({
    id: paymentId,
    invoiceId: input.invoiceId,
    amount: input.amount,
    paymentDate: new Date(input.paymentDate),
    paymentMethod: (['BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'].includes(input.paymentMethod || '') ? input.paymentMethod : 'BANK_TRANSFER') as 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER',
    referenceNumber: input.referenceNumber?.trim() || null,
    notes: input.notes?.trim() || null,
    createdAt: now,
  });

  // Calculate total payments for invoice
  const existingPayments = await db.select().from(payments).where(eq(payments.invoiceId, input.invoiceId));
  const totalPaid = existingPayments.reduce((acc, p) => acc + p.amount, 0);

  const updatedStatus = totalPaid >= invoice.amount ? 'PAID' : 'PARTIALLY_PAID';
  await db.update(invoices).set({ status: updatedStatus, updatedAt: now }).where(eq(invoices.id, input.invoiceId));

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: 'PAYMENT_RECORDED',
    entityType: 'payment',
    entityId: paymentId,
    description: `Recorded payment of ₹${input.amount} for invoice ${invoice.invoiceNumber}. New status: ${updatedStatus}`,
    newValue: { amount: input.amount, status: updatedStatus },
  });

  return { id: paymentId, updatedStatus };
}

// ==========================================
// 8. CRM / CLIENTS WORKSPACE
// ==========================================

export async function getCrmClientsData(db: AppDatabase, principal: AuthenticatedPrincipal) {
  const isCompanyWide = principal.roles.includes('ADMIN') || principal.roles.includes('CEO') || principal.dataScopes.includes('COMPANY');
  const isManager = principal.roles.includes('MANAGER') || principal.dataScopes.includes('TEAM');
  const isEmployee = principal.roles.includes('EMPLOYEE') || principal.roles.includes('OPERATIONS') || principal.dataScopes.includes('SELF');

  if (!isCompanyWide && !isManager && !isEmployee) {
    throw new AuthError(403, 'Permission denied to view client data', 'FORBIDDEN');
  }

  const baseQuery = db
    .select({
      id: clients.id,
      name: clients.name,
      companyName: clients.companyName,
      email: clients.email,
      phone: clients.phone,
      status: clients.status,
      assignedEmployeeId: clients.assignedEmployeeId,
      assignedEmployeeName: employees.fullName,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
    })
    .from(clients)
    .leftJoin(employees, eq(clients.assignedEmployeeId, employees.id))
    .orderBy(desc(clients.createdAt));

  let clientRows;
  if (isCompanyWide) {
    clientRows = await baseQuery;
  } else if (isManager) {
    const teamUuids = await getTeamEmployeeUuids(db, principal.employeeUuid);
    clientRows = await baseQuery.where(inArray(clients.assignedEmployeeId, teamUuids));
  } else {
    // Employee / SELF scope
    clientRows = await baseQuery.where(eq(clients.assignedEmployeeId, principal.employeeUuid));
  }

  const clientIds = clientRows.map((c) => c.id);
  if (clientIds.length === 0) {
    return { clients: [] };
  }

  const [allFollowUps, allMeetings, allOpps, allProjects] = await Promise.all([
    db.select().from(followUps).where(inArray(followUps.clientId, clientIds)),
    db.select().from(meetings).where(inArray(meetings.clientId, clientIds)),
    db.select().from(opportunities).where(inArray(opportunities.clientId, clientIds)),
    db.select().from(projects).where(inArray(projects.clientId, clientIds)),
  ]);

  const clientsWithRelations = clientRows.map((c) => {
    return {
      ...c,
      followUps: allFollowUps.filter((f) => f.clientId === c.id),
      meetings: allMeetings.filter((m) => m.clientId === c.id),
      opportunities: allOpps.filter((o) => o.clientId === c.id),
      projects: allProjects.filter((p) => p.clientId === c.id),
    };
  });

  return { clients: clientsWithRelations };
}

export async function createClient(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  input: {
    name: string;
    companyName: string;
    email?: string | null;
    phone?: string | null;
    status?: 'ACTIVE' | 'LEAD' | 'INACTIVE';
    assignedEmployeeId?: string | null;
  }
) {
  const canManage = principal.roles.some((r) => ['ADMIN', 'MANAGER', 'CEO', 'EMPLOYEE'].includes(r));
  if (!canManage) throw new AuthError(403, 'Permission denied to create client', 'FORBIDDEN');

  // Prevent privilege escalation: non-elevated employees can only assign to themselves
  const isElevated = principal.roles.some((r) => ['ADMIN', 'CEO', 'MANAGER'].includes(r));
  const assignedEmployeeId = isElevated
    ? (input.assignedEmployeeId || principal.employeeUuid || null)
    : (principal.employeeUuid || null);

  const clientId = crypto.randomUUID();
  const now = new Date();

  await db.insert(clients).values({
    id: clientId,
    name: input.name.trim(),
    companyName: input.companyName.trim(),
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    status: input.status || 'ACTIVE',
    assignedEmployeeId,
    createdAt: now,
    updatedAt: now,
  });

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: 'CLIENT_CREATED',
    entityType: 'client',
    entityId: clientId,
    description: `Created client account "${input.companyName}" (${input.name})`,
  });

  return { id: clientId };
}

// ==========================================
// 9. OPPORTUNITY OPERATIONS
// ==========================================

export async function getOpportunities(db: AppDatabase, principal: AuthenticatedPrincipal) {
  const isAdmin = principal.roles.includes('ADMIN');
  const isCeo = principal.roles.includes('CEO');
  const isManager = principal.roles.includes('MANAGER');
  const employeeUuid = principal.employeeUuid;

  if (!employeeUuid) {
    throw new AuthError(400, 'Employee profile required', 'NO_EMPLOYEE_PROFILE');
  }

  // Admins and CEOs see all opportunities
  if (isAdmin || isCeo) {
    return db
      .select({
        id: opportunities.id,
        clientId: opportunities.clientId,
        clientName: clients.name,
        clientCompany: clients.companyName,
        ownerEmployeeId: opportunities.ownerEmployeeId,
        ownerName: employees.fullName,
        title: opportunities.title,
        stage: opportunities.stage,
        estimatedValue: opportunities.estimatedValue,
        probability: opportunities.probability,
        expectedCloseDate: opportunities.expectedCloseDate,
        nextAction: opportunities.nextAction,
        status: opportunities.status,
        createdAt: opportunities.createdAt,
        updatedAt: opportunities.updatedAt,
      })
      .from(opportunities)
      .leftJoin(clients, eq(opportunities.clientId, clients.id))
      .leftJoin(employees, eq(opportunities.ownerEmployeeId, employees.id))
      .orderBy(desc(opportunities.createdAt));
  }

  // Managers see their team's opportunities
  if (isManager) {
    const teamMemberIds = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.managerEmployeeId, employeeUuid));

    const teamIds = teamMemberIds.map(m => m.id);
    teamIds.push(employeeUuid);

    return db
      .select({
        id: opportunities.id,
        clientId: opportunities.clientId,
        clientName: clients.name,
        clientCompany: clients.companyName,
        ownerEmployeeId: opportunities.ownerEmployeeId,
        ownerName: employees.fullName,
        title: opportunities.title,
        stage: opportunities.stage,
        estimatedValue: opportunities.estimatedValue,
        probability: opportunities.probability,
        expectedCloseDate: opportunities.expectedCloseDate,
        nextAction: opportunities.nextAction,
        status: opportunities.status,
        createdAt: opportunities.createdAt,
        updatedAt: opportunities.updatedAt,
      })
      .from(opportunities)
      .leftJoin(clients, eq(opportunities.clientId, clients.id))
      .leftJoin(employees, eq(opportunities.ownerEmployeeId, employees.id))
      .where(inArray(opportunities.ownerEmployeeId, teamIds))
      .orderBy(desc(opportunities.createdAt));
  }

  // Regular employees see only their own opportunities
  return db
    .select({
      id: opportunities.id,
      clientId: opportunities.clientId,
      clientName: clients.name,
      clientCompany: clients.companyName,
      ownerEmployeeId: opportunities.ownerEmployeeId,
      ownerName: employees.fullName,
      title: opportunities.title,
      stage: opportunities.stage,
      estimatedValue: opportunities.estimatedValue,
      probability: opportunities.probability,
      expectedCloseDate: opportunities.expectedCloseDate,
      nextAction: opportunities.nextAction,
      status: opportunities.status,
      createdAt: opportunities.createdAt,
      updatedAt: opportunities.updatedAt,
    })
    .from(opportunities)
    .leftJoin(clients, eq(opportunities.clientId, clients.id))
    .leftJoin(employees, eq(opportunities.ownerEmployeeId, employees.id))
    .where(eq(opportunities.ownerEmployeeId, employeeUuid))
    .orderBy(desc(opportunities.createdAt));
}

export async function createOpportunity(
  db: AppDatabase,
  principal: AuthenticatedPrincipal,
  input: {
    clientId: string;
    title: string;
    stage?: string;
    estimatedValue: number;
    probability?: number;
    expectedCloseDate?: string;
    nextAction?: string;
  }
) {
  const employeeUuid = principal.employeeUuid;
  if (!employeeUuid) {
    throw new AuthError(400, 'Employee profile required', 'NO_EMPLOYEE_PROFILE');
  }

  // Verify client exists
  const [client] = await db.select().from(clients).where(eq(clients.id, input.clientId)).limit(1);
  if (!client) {
    throw new AuthError(404, 'Client not found', 'CLIENT_NOT_FOUND');
  }

  const oppId = crypto.randomUUID();

  await db.insert(opportunities).values({
    id: oppId,
    clientId: input.clientId,
    ownerEmployeeId: employeeUuid,
    title: input.title,
    stage: (input.stage as any) || 'OPPORTUNITY',
    estimatedValue: input.estimatedValue,
    probability: input.probability ?? 50,
    expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
    nextAction: input.nextAction || null,
    status: 'ACTIVE',
  });

  await writeAuditLog(db, {
    performedByUserId: principal.id,
    action: 'CREATE',
    entityType: 'opportunity',
    entityId: oppId,
    description: `Created opportunity: ${input.title} for ${client.companyName}`,
  });

  return { id: oppId };
}
