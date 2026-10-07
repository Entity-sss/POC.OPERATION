import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { updateTaskExecution } from '@/lib/services/operations';
import { apiError, jsonResponse, parseJson } from '@/lib/auth/http';
import { z } from 'zod';

export const prerender = false;

const updateTaskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'COMPLETED']).optional(),
  evidence: z.string().optional(),
  evidenceType: z.enum(['DOCUMENT', 'EMAIL', 'NOTE', 'LINK']).optional(),
  makerNotes: z.string().optional(),
});

export const PATCH: APIRoute = async (context) => {
  try {
    const taskId = context.params.id;
    if (!taskId) return jsonResponse({ error: 'Task ID required' }, { status: 400 });

    const body = await parseJson(context);
    const input = updateTaskSchema.parse(body);

    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);

    const result = await updateTaskExecution(db, principal, taskId, input);
    return jsonResponse(result);
  } catch (error) {
    return apiError(error);
  }
};
