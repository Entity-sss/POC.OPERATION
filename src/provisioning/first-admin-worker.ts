import { createDb } from '@/lib/db';
import { AuthError, provisionFirstAdmin, secretMatches } from '@/lib/auth/service';
import { registrationSchema } from '@/lib/auth/validation';

export interface ProvisioningEnv {
  poc_operation_db: D1Database;
  FIRST_ADMIN_PROVISION_TOKEN?: string;
}

/**
 * Operational entrypoint only. It is not part of the Astro Worker, has no route,
 * and must only be started locally with Wrangler's remote D1 binding.
 */
export default {
  async fetch(request: Request, env: ProvisioningEnv): Promise<Response> {
    if (request.method !== 'POST') return new Response(null, { status: 405 });
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace(/^Bearer\s+/i, '')?.trim();
      const expectedToken = env.FIRST_ADMIN_PROVISION_TOKEN?.trim();

      // Fail closed immediately before attempting to parse request body or access database
      if (!expectedToken || !token || !secretMatches(expectedToken, token)) {
        throw new AuthError(403, 'First-admin provisioning is not authorized', 'PROVISIONING_UNAUTHORIZED');
      }

      let rawBody: unknown;
      try {
        rawBody = await request.json();
      } catch {
        return Response.json({ success: false, error: 'INVALID_JSON' }, { status: 400 });
      }

      const input = registrationSchema.parse(rawBody);
      const result = await provisionFirstAdmin(createDb(env.poc_operation_db), token, expectedToken, input);
      return Response.json({ success: true, employeeId: result.employeeId }, { status: 201 });
    } catch (error) {
      const status = error instanceof AuthError ? error.status : 400;
      return Response.json({ success: false, error: error instanceof AuthError ? error.code : 'INVALID_REQUEST' }, { status });
    }
  },
} satisfies ExportedHandler<ProvisioningEnv>;
