import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPermissions, getPrincipal } from '@/lib/auth/service';
import { apiError, jsonResponse } from '@/lib/auth/http';

export const prerender = false;
export const GET: APIRoute = async (context) => {
  try {
    const db = createDb(env.poc_operation_db); const principal = await getPrincipal(db, context.locals.auth);
    return jsonResponse({ user: principal, permissions: [...await getPermissions(db, principal.id)].sort() });
  } catch (error) { return apiError(error); }
};
