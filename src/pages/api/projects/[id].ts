import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { updateProjectStatus } from '@/lib/services/operations';
import { apiError, jsonResponse } from '@/lib/auth/http';
import { updateProjectStatusSchema } from '@/lib/validation/schemas';

export const prerender = false;

export const PATCH: APIRoute = async (context) => {
  try {
    const projectId = context.params.id;
    if (!projectId) {
      return jsonResponse({ error: 'Project ID is required' }, { status: 400 });
    }

    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);
    const body = await context.request.json();
    const validated = updateProjectStatusSchema.parse(body);
    const result = await updateProjectStatus(db, principal, projectId, validated.status);
    return jsonResponse(result);
  } catch (error) {
    return apiError(error);
  }
};
