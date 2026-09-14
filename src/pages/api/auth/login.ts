import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { login } from '@/lib/auth/service';
import { loginSchema } from '@/lib/auth/validation';
import { apiError, jsonResponse, parseJson, setSessionCookie } from '@/lib/auth/http';

export const prerender = false;
export const POST: APIRoute = async (context) => {
  try {
    const input = loginSchema.parse(await parseJson(context));
    const result = await login(createDb(env.poc_operation_db), input.employeeId, input.password);
    setSessionCookie(context, result.token, result.expiresAt);
    return jsonResponse({ user: result.context.user });
  } catch (error) { return apiError(error); }
};
