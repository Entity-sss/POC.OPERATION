import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { getAuthContext } from '@/lib/auth/service';
import { SESSION_COOKIE } from '@/lib/auth/http';
import { errorResponse } from '@/lib/utils';
import { defineMiddleware } from 'astro:middleware';

const publicPaths = new Set(['/', '/register', '/api/health', '/api/auth/login', '/api/auth/register']);

export const onRequest = defineMiddleware(async (context, next) => {
  const db = createDb(env.poc_operation_db);
  context.locals.auth = await getAuthContext(db, context.cookies.get(SESSION_COOKIE)?.value);
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(context.request.method)) {
    const origin = context.request.headers.get('origin');
    if (origin && origin !== context.url.origin) return errorResponse('Cross-site request rejected', 403, 'CSRF_REJECTED');
  }
  if (publicPaths.has(context.url.pathname) || context.url.pathname === '/api/auth/logout') return next();
  if (context.locals.auth.isAuthenticated) return next();
  if (context.url.pathname.startsWith('/api/')) return errorResponse('Authentication is required', 401, 'UNAUTHENTICATED');
  return context.redirect('/');
});
