import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { reviewDelayRequest } from '@/lib/services/operations';
import { apiError, jsonResponse, parseJson } from '@/lib/auth/http';
import { z } from 'zod';

export const prerender = false;

const reviewDelaySchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reviewRemarks: z.string().optional(),
});

export const POST: APIRoute = async (context) => {
  try {
    const requestId = context.params.id;
    if (!requestId) return jsonResponse({ error: 'Request ID required' }, { status: 400 });

    const body = await parseJson(context);
    const input = reviewDelaySchema.parse(body);

    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);

    const result = await reviewDelayRequest(db, principal, requestId, input);
    return jsonResponse(result);
  } catch (error) {
    return apiError(error);
  }
};
