import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getPrincipal } from '@/lib/auth/service';
import { createClient, getCrmClientsData } from '@/lib/services/operations';
import { apiError, jsonResponse } from '@/lib/auth/http';
import { createClientSchema } from '@/lib/validation/schemas';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);
    const data = await getCrmClientsData(db, principal);
    return jsonResponse(data);
  } catch (error) {
    return apiError(error);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const db = createDb(env.poc_operation_db);
    const principal = await getPrincipal(db, context.locals.auth);
    const body = await context.request.json();
    const validated = createClientSchema.parse(body);
    const result = await createClient(db, principal, validated);
    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
};
