import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { apiError, jsonResponse } from '@/lib/auth/http';
import { clients, employees, tasks } from '@/lib/db/schema';
import { like, or } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const url = new URL(context.request.url);
    const q = url.searchParams.get('q')?.trim() || '';

    if (!q || q.length < 2) {
      return jsonResponse({ results: [] });
    }

    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);

    const searchPattern = `%${q}%`;

    // 1. Search Tasks
    const matchingTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        priority: tasks.priority,
        status: tasks.status,
      })
      .from(tasks)
      .where(like(tasks.title, searchPattern))
      .limit(5);

    // 2. Search Clients
    const matchingClients = await db
      .select({
        id: clients.id,
        name: clients.name,
        companyName: clients.companyName,
      })
      .from(clients)
      .where(or(like(clients.name, searchPattern), like(clients.companyName, searchPattern)))
      .limit(5);

    // 3. Search Employees (if manager/admin)
    let matchingEmployees: Array<{ id: string; fullName: string; employeeId: string }> = [];
    const isManagerOrAdmin = principal.roles.some((r) => ['ADMIN', 'MANAGER', 'CEO'].includes(r));
    if (isManagerOrAdmin) {
      matchingEmployees = await db
        .select({
          id: employees.id,
          fullName: employees.fullName,
          employeeId: employees.employeeId,
        })
        .from(employees)
        .where(or(like(employees.fullName, searchPattern), like(employees.employeeId, searchPattern)))
        .limit(5);
    }

    const results = [
      ...matchingTasks.map((t) => ({
        type: 'TASK',
        id: t.id,
        title: t.title,
        subtitle: `Task • ${t.priority} • ${t.status}`,
        targetHash: '#tasks',
      })),
      ...matchingClients.map((c) => ({
        type: 'CLIENT',
        id: c.id,
        title: c.companyName || c.name,
        subtitle: `Client • ${c.name}`,
        targetHash: '#clients',
      })),
      ...matchingEmployees.map((e) => ({
        type: 'EMPLOYEE',
        id: e.id,
        title: e.fullName,
        subtitle: `Employee • ${e.employeeId}`,
        targetHash: '#team',
      })),
    ];

    return jsonResponse({ results });
  } catch (error) {
    return apiError(error);
  }
};
