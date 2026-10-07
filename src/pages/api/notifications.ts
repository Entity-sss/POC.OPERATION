import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { apiError, jsonResponse } from '@/lib/auth/http';
import { dailyWorkReports, taskDelayRequests, tasks } from '@/lib/db/schema';
import { and, eq, inArray, lt } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);
    const now = new Date();

    const notifications: Array<{
      id: string;
      title: string;
      message: string;
      type: 'WARNING' | 'INFO' | 'URGENT';
      time: string;
      targetHash: string;
    }> = [];

    // 1. Employee overdue tasks
    if (principal.employeeUuid) {
      const overdueTasks = await db
        .select({ id: tasks.id, title: tasks.title, currentDueDate: tasks.currentDueDate })
        .from(tasks)
        .where(
          and(
            eq(tasks.assignedToEmployeeId, principal.employeeUuid),
            lt(tasks.currentDueDate, now),
            inArray(tasks.status, ['TODO', 'IN_PROGRESS', 'PENDING_VERIFICATION'])
          )
        )
        .limit(3);

      for (const t of overdueTasks) {
        notifications.push({
          id: `task-overdue-${t.id}`,
          title: 'Overdue Task Deliverable',
          message: `Task "${t.title}" is overdue SLA deadline.`,
          type: 'URGENT',
          time: new Date(t.currentDueDate).toLocaleDateString(),
          targetHash: '#tasks',
        });
      }
    }

    // 2. Manager pending reports & delay requests
    const isManager = principal.roles.some((r) => ['MANAGER', 'ADMIN', 'CEO'].includes(r));
    if (isManager) {
      const pendingReports = await db
        .select({ id: dailyWorkReports.id, reportDate: dailyWorkReports.reportDate })
        .from(dailyWorkReports)
        .where(eq(dailyWorkReports.status, 'SUBMITTED'))
        .limit(3);

      for (const r of pendingReports) {
        notifications.push({
          id: `report-${r.id}`,
          title: 'Daily Report Awaiting Review',
          message: `Team submission for ${r.reportDate} pending verification.`,
          type: 'INFO',
          time: r.reportDate,
          targetHash: '#reports',
        });
      }

      const pendingDelays = await db
        .select({ id: taskDelayRequests.id, reason: taskDelayRequests.reason })
        .from(taskDelayRequests)
        .where(eq(taskDelayRequests.status, 'PENDING'))
        .limit(3);

      for (const d of pendingDelays) {
        notifications.push({
          id: `delay-${d.id}`,
          title: 'SLA Delay Request Pending',
          message: d.reason,
          type: 'WARNING',
          time: 'Pending',
          targetHash: '#delays',
        });
      }
    }

    return jsonResponse({
      unreadCount: notifications.length,
      items: notifications,
    });
  } catch (error) {
    return apiError(error);
  }
};
