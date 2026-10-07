import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getEmployeeDetail, updateEmployee } from '@/lib/auth/service';
import { updateEmployeeSchema } from '@/lib/auth/validation';
import { apiError, jsonResponse, parseJson } from '@/lib/auth/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const db = createDb(env.poc_operation_db);
    const employee = await getEmployeeDetail(db, context.locals.auth, context.params.id!);
    return jsonResponse({ employee });
  } catch (error) {
    return apiError(error);
  }
};

export const PATCH: APIRoute = async (context) => {
  try {
    const input = updateEmployeeSchema.parse(await parseJson(context));
    const db = createDb(env.poc_operation_db);
    const result = await updateEmployee(db, context.locals.auth, context.params.id!, input);
    return jsonResponse(result);
  } catch (error) {
    return apiError(error);
  }
};
