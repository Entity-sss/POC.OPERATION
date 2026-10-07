export interface AuthMeResponse {
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    isActive: boolean;
    roles?: Array<{ id: string; code: string; name: string }>;
    dataScopes?: Array<{ roleId: string; scopeType: string; departmentId: string | null }>;
  };
  permissions: string[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export async function loginUser(employeeId: string, password: string): Promise<{ success: true; user: AuthMeResponse['user'] } | { success: false; error: string; code?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employeeId, password }),
    });

    const data: any = await res.json();

    if (!res.ok) {
      const errData = data as ApiErrorResponse;
      const message = errData?.error?.message || 'Login failed. Please verify your credentials.';
      return { success: false, error: message, code: errData?.error?.code };
    }

    const payload = data?.data ?? data;
    return { success: true, user: payload.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected network error occurred.' };
  }
}

export async function logoutUser(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getAuthMe(): Promise<AuthMeResponse | null> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const json: any = await res.json();
    return (json?.data ?? json) as AuthMeResponse;
  } catch {
    return null;
  }
}

export interface RegisterInput {
  fullName: string;
  mobile: string;
  email: string;
  dateOfBirth?: string;
  currentAddress: string;
  permanentAddress: string;
  education: string;
  priorExperience: string;
}

export async function registerUser(input: RegisterInput): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const data: any = await res.json();

    if (!res.ok) {
      const errData = data as ApiErrorResponse;
      return { success: false, error: errData?.error?.message || 'Registration failed.' };
    }

    const payload = data?.data ?? data;
    const id = payload.registrationRequestId || payload.id;
    if (!id) {
      return { success: false, error: 'Server did not return a registration reference ID.' };
    }

    return { success: true, id };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected network error occurred.' };
  }
}
