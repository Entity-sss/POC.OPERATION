import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { createRegistrationRequest } from '@/lib/auth/service';
import { registrationSchema } from '@/lib/auth/validation';
import { apiError, jsonResponse, parseJson } from '@/lib/auth/http';

export const prerender = false;
export const POST: APIRoute = async (context) => {
  try {
    const input = registrationSchema.parse(await parseJson(context));
    const id = await createRegistrationRequest(createDb(env.poc_operation_db), input);
    return jsonResponse({ registrationRequestId: id, status: 'PENDING' }, { status: 201 });
  } catch (error) { return apiError(error); }
};
