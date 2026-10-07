import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { saveDailyWorkReport } from '@/lib/services/operations';
import { apiError, jsonResponse, parseJson } from '@/lib/auth/http';
import { z } from 'zod';

export const prerender = false;

const reportSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  status: z.enum(['DRAFT', 'SUBMITTED']),
  callsCount: z.number().int().nonnegative().optional(),
  meetingsCount: z.number().int().nonnegative().optional(),
  followUpsCount: z.number().int().nonnegative().optional(),
  dealsSummary: z.string().optional(),
  completedTasksSummary: z.string().optional(),
  pendingTasksSummary: z.string().optional(),
  notes: z.string().optional(),
});

export const POST: APIRoute = async (context) => {
  try {
    const body = await parseJson(context);
    const input = reportSchema.parse(body);

    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);

    const result = await saveDailyWorkReport(db, principal, input);
    return jsonResponse(result);
  } catch (error) {
    return apiError(error);
  }
};
