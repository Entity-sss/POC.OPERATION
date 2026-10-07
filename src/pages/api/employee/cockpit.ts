import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { getEmployeeCockpitData } from '@/lib/services/operations';
import { apiError, jsonResponse } from '@/lib/auth/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);
    const data = await getEmployeeCockpitData(db, principal);
    return jsonResponse(data);
  } catch (error) {
    return apiError(error);
  }
};
