import React, { useState, useEffect } from 'react';
import { PasswordInput } from '../ui/PasswordInput';
import { Alert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Icons } from '../ui/Icons';
import { loginUser } from '@/lib/auth/client';

interface LoginFormProps {
  initialReason?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ initialReason }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(
    initialReason === 'session-expired'
      ? 'Your session has expired. Please sign in again to continue.'
      : null
  );

  useEffect(() => {
    // Check remembered employee ID
    const saved = localStorage.getItem('poc_saved_employee_id');
    if (saved) {
      setEmployeeId(saved);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSessionExpiredNotice(null);

    const trimmedId = employeeId.trim();
    if (!trimmedId) {
      setErrorMessage('Please enter your Employee ID or corporate Email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginUser(trimmedId, password);

      if (!result.success) {
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('poc_saved_employee_id', trimmedId);
      } else {
        localStorage.removeItem('poc_saved_employee_id');
      }

      // Successful login redirect to main app dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary tracking-tight">
          Sign In to Pinnacle
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          Access your mission-critical operations dashboard and workflows.
        </p>
      </div>

      {sessionExpiredNotice && (
        <div className="mb-4">
          <Alert type="warning" title="Session Timeout" message={sessionExpiredNotice} />
        </div>
      )}

      {errorMessage && (
        <div className="mb-4">
          <Alert type="error" title="Authentication Error" message={errorMessage} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Employee ID / Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="employeeId"
            className="text-xs font-medium text-text-secondary tracking-wide uppercase"
          >
            Employee ID or Email
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-text-tertiary pointer-events-none flex items-center justify-center">
              <Icons.User className="w-4 h-4" />
            </div>
            <input
              id="employeeId"
              type="text"
              name="employeeId"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="EMP-001 or user@pinnacle.com"
              autoComplete="username"
              required
              disabled={isLoading}
              className="w-full bg-surface-card/80 border border-border-default focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 outline-none uppercase font-mono placeholder:normal-case placeholder:font-sans"
            />
          </div>
        </div>

        {/* Password */}
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          autoComplete="current-password"
          required
          disabled={isLoading}
        />

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-text-secondary hover:text-text-primary transition-colors">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded bg-surface-card border-border-default text-brand-primary focus:ring-brand-primary/40 focus:ring-offset-0 focus:ring-1 accent-brand-primary cursor-pointer"
            />
            <span>Remember ID</span>
          </label>

          <a
            href="mailto:it-support@pinnacle.com?subject=POC.OPERATION%20Password%20Reset%20Request"
            className="text-brand-primary hover:text-brand-primary-hover font-medium transition-colors focus:outline-none focus:underline"
          >
            Forgot Password?
          </a>
        </div>

        {/* Sign In Primary CTA */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 px-4 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-text-inverse font-semibold text-sm tracking-wide shadow-gold-glow hover:shadow-gold-glow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-primary/80 focus:ring-offset-2 focus:ring-offset-surface-base"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="text-text-inverse" label="Authenticating..." />
          ) : (
            <>
              <span>Sign In</span>
              <Icons.ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Apply for Employee Account */}
      <div className="mt-6 pt-5 border-t border-border-subtle/80 flex flex-col items-center justify-center gap-2 text-center text-xs text-text-secondary">
        <span>New team member or contractor?</span>
        <a
          href="/register"
          className="w-full py-2.5 px-4 rounded-lg border border-border-default hover:border-brand-primary/50 bg-surface-card/40 hover:bg-surface-card/70 text-text-primary font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-1 focus:ring-brand-primary"
        >
          <Icons.User className="w-4 h-4 text-brand-primary" />
          <span>Apply for Employee Account</span>
        </a>
      </div>
    </div>
  );
};
