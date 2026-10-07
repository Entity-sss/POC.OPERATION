import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { listEmployees } from '@/lib/auth/service';
import { apiError, jsonResponse } from '@/lib/auth/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const db = createDb(env.poc_operation_db);
    const employees = await listEmployees(db, context.locals.auth);
    return jsonResponse({ employees });
  } catch (error) {
    return apiError(error);
  }
};
