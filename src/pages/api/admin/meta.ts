import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getAdminMetadata } from '@/lib/auth/service';
import { apiError, jsonResponse } from '@/lib/auth/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const db = createDb(env.poc_operation_db);
    const meta = await getAdminMetadata(db, context.locals.auth);
    return jsonResponse(meta);
  } catch (error) {
    return apiError(error);
  }
};
