import type { APIContext } from 'astro';
import { ZodError } from 'zod';
import { errorResponse, jsonResponse } from '@/lib/utils';
import { AuthError } from './service';

export const SESSION_COOKIE = 'poc_operation_session';

export function setSessionCookie(context: APIContext, token: string, expiresAt: Date): void {
  context.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: new URL(context.request.url).protocol === 'https:', sameSite: 'strict', path: '/', expires: expiresAt });
}

export function clearSessionCookie(context: APIContext): void {
  context.cookies.delete(SESSION_COOKIE, { httpOnly: true, secure: new URL(context.request.url).protocol === 'https:', sameSite: 'strict', path: '/' });
}

export function apiError(error: unknown): Response {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const message = firstIssue ? `${firstIssue.path.join('.') || 'input'}: ${firstIssue.message}` : 'Validation error';
    return errorResponse(message, 400, 'VALIDATION_ERROR', error.issues);
  }
  if (error instanceof AuthError) return errorResponse(error.message, error.status, error.code);
  if (error instanceof SyntaxError) return errorResponse('Request body must be valid JSON', 400, 'INVALID_JSON');
  console.error('Unhandled API error', error instanceof Error ? error.message : 'unknown error');
  return errorResponse('An unexpected server error occurred', 500, 'INTERNAL_ERROR');
}

export async function parseJson(context: APIContext): Promise<unknown> { return context.request.json(); }
export { jsonResponse };
