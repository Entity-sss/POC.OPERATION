import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { updateFollowUp } from '@/lib/services/operations';
import { apiError, jsonResponse, parseJson } from '@/lib/auth/http';
import { z } from 'zod';

export const prerender = false;

const followUpSchema = z.object({
  status: z.enum(['UPCOMING', 'COMPLETED', 'OVERDUE', 'CANCELLED']).optional(),
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
  nextFollowUpDate: z.number().optional(),
  notes: z.string().optional(),
});

export const PATCH: APIRoute = async (context) => {
  try {
    const followUpId = context.params.id;
    if (!followUpId) return jsonResponse({ error: 'ID required' }, { status: 400 });

    const body = await parseJson(context);
    const input = followUpSchema.parse(body);

    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);

    const result = await updateFollowUp(db, principal, followUpId, input);
    return jsonResponse(result);
  } catch (error) {
    return apiError(error);
  }
};
