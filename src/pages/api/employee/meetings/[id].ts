import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { updateMeeting } from '@/lib/services/operations';
import { apiError, jsonResponse, parseJson } from '@/lib/auth/http';
import { z } from 'zod';

export const prerender = false;

const meetingSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
  notes: z.string().optional(),
});

export const PATCH: APIRoute = async (context) => {
  try {
    const meetingId = context.params.id;
    if (!meetingId) return jsonResponse({ error: 'ID required' }, { status: 400 });

    const body = await parseJson(context);
    const input = meetingSchema.parse(body);

    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);

    const result = await updateMeeting(db, principal, meetingId, input);
    return jsonResponse(result);
  } catch (error) {
    return apiError(error);
  }
};
