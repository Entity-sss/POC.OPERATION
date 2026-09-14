import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { logout } from '@/lib/auth/service';
import { apiError, clearSessionCookie, jsonResponse } from '@/lib/auth/http';

export const prerender = false;
export const POST: APIRoute = async (context) => {
  try { await logout(createDb(env.poc_operation_db), context.locals.auth); clearSessionCookie(context); return jsonResponse({}); }
  catch (error) { return apiError(error); }
};
