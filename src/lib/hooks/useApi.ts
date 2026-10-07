import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

/**
 * Centralized API fetch hook with error handling and loading states
 * Eliminates ~150-200 lines of duplicate fetch logic across components
 */
export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (url: string, init?: RequestInit) => {
      setState({ data: null, loading: true, error: null });

      try {
        const res = await fetch(url, init);

        if (!res.ok) {
          let errorMessage = `Request failed with status ${res.status}`;
          if (res.headers.get('content-type')?.includes('application/json')) {
            try {
              const errorData = await res.json();
              if (errorData && typeof errorData === 'object' && 'error' in errorData && typeof errorData.error === 'string') {
                errorMessage = errorData.error;
              }
            } catch {
              // fallback to default message
            }
          }
          throw new Error(errorMessage);
        }

        const json = await res.json();
        setState({ data: json as T, loading: false, error: null });

        if (options.onSuccess) {
          options.onSuccess(json);
        }

        return json;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setState({ data: null as T | null, loading: false, error: errorMessage });

        if (options.onError) {
          options.onError(errorMessage);
        }

        throw err;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Simplified fetch helper for one-off API calls without state management
 */
export async function apiFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    if (res.headers.get('content-type')?.includes('application/json')) {
      try {
        const errorData = await res.json();
        if (errorData && typeof errorData === 'object' && 'error' in errorData && typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        }
      } catch {
        // fallback to default message
      }
    }
    throw new Error(errorMessage);
  }

  return res.json();
}
