import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { verifyTask } from '@/lib/services/operations';
import { apiError, jsonResponse, parseJson } from '@/lib/auth/http';
import { z } from 'zod';

export const prerender = false;

const verifyTaskSchema = z.object({
  approved: z.boolean(),
  checkerNotes: z.string().optional(),
});

export const POST: APIRoute = async (context) => {
  try {
    const taskId = context.params.id;
    if (!taskId) return jsonResponse({ error: 'Task ID required' }, { status: 400 });

    const body = await parseJson(context);
    const input = verifyTaskSchema.parse(body);

    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);

    const result = await verifyTask(db, principal, taskId, input);
    return jsonResponse(result);
  } catch (error) {
    return apiError(error);
  }
};
