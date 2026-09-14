import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { reviewRegistrationRequest } from '@/lib/auth/service';
import { reviewRegistrationSchema } from '@/lib/auth/validation';
import { apiError, jsonResponse, parseJson } from '@/lib/auth/http';

export const prerender = false;
export const POST: APIRoute = async (context) => {
  try {
    const input = reviewRegistrationSchema.parse(await parseJson(context));
    const result = await reviewRegistrationRequest(createDb(env.poc_operation_db), context.locals.auth, context.params.id!, input);
    return jsonResponse({ status: input.action === 'APPROVE' ? 'APPROVED' : 'REJECTED', ...result });
  } catch (error) { return apiError(error); }
};
