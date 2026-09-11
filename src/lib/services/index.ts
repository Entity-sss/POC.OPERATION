/**
 * Base Service Contracts & Types
 */

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function serviceSuccess<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

export function serviceFailure<T = void>(
  code: string,
  message: string,
  details?: unknown
): ServiceResult<T> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}
