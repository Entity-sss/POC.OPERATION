import { z } from 'zod';

/**
 * Validation Foundation Utilities
 */

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: z.ZodError<T> };

/**
 * Validates data against a Zod schema returning structured result
 */
export function validateSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Formats a Zod error into a clean record of field errors
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  return formatted;
}
