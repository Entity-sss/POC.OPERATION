import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { reviewDailyWorkReport } from '@/lib/services/operations';
import { apiError, jsonResponse, parseJson } from '@/lib/auth/http';
import { z } from 'zod';

export const prerender = false;

const reviewReportSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
});

export const POST: APIRoute = async (context) => {
  try {
    const reportId = context.params.id;
    if (!reportId) return jsonResponse({ error: 'Report ID required' }, { status: 400 });

    const body = await parseJson(context);
    const input = reviewReportSchema.parse(body);

    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);

    const result = await reviewDailyWorkReport(db, principal, reportId, input);
    return jsonResponse(result);
  } catch (error) {
    return apiError(error);
  }
};
