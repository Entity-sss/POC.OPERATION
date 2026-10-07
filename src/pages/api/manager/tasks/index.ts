import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { getManagerOperationsData, assignTask } from '@/lib/services/operations';
import { apiError, jsonResponse } from '@/lib/auth/http';
import { assignTaskSchema } from '@/lib/validation/schemas';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);
    // Only managers and above can view team tasks
    const isManager = principal.roles.includes('MANAGER') || principal.roles.includes('ADMIN') || principal.roles.includes('CEO');
    if (!isManager) {
      throw new Error('Manager permissions required');
    }

    const data = await getManagerOperationsData(db, principal);
    return jsonResponse({ tasks: data.teamTasks });
  } catch (error) {
    return apiError(error);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);

    const body = await context.request.json();
    // Validate input using Zod schema
    const validatedData = assignTaskSchema.parse(body);
    const result = await assignTask(db, principal, validatedData);

    return jsonResponse(result);
  } catch (error) {
    return apiError(error);
  }
};