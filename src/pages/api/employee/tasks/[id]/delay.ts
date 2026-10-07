import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { requestTaskDelay } from '@/lib/services/operations';
import { apiError, jsonResponse, parseJson } from '@/lib/auth/http';
import { z } from 'zod';

export const prerender = false;

const delaySchema = z.object({
  requestedDueDate: z.number().positive(),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  businessImpact: z.string().optional(),
});

export const POST: APIRoute = async (context) => {
  try {
    const taskId = context.params.id;
    if (!taskId) return jsonResponse({ error: 'Task ID required' }, { status: 400 });

    const body = await parseJson(context);
    const input = delaySchema.parse(body);

    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);

    const result = await requestTaskDelay(db, principal, taskId, input);
    return jsonResponse(result);
  } catch (error) {
    return apiError(error);
  }
};
