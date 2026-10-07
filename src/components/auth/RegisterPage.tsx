import React, { useState } from 'react';
import { Alert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Icons } from '../ui/Icons';
import { registerUser } from '@/lib/auth/client';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    dateOfBirth: '',
    currentAddress: '',
    permanentAddress: '',
    education: '',
    priorExperience: '',
  });

  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (sameAsCurrent && name === 'currentAddress') {
        updated.permanentAddress = value;
      }
      return updated;
    });
  };

  const handleSameAddressToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameAsCurrent(checked);
    if (checked) {
      setFormData((prev) => ({ ...prev, permanentAddress: prev.currentAddress }));
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    setIsLoading(true);

    try {
      const result = await registerUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth : undefined,
        currentAddress: formData.currentAddress.trim(),
        permanentAddress: formData.permanentAddress.trim(),
        education: formData.education.trim(),
        priorExperience: formData.priorExperience.trim(),
      });

      if (!result.success) {
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      setSuccessId(result.id);
      setIsLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-panel p-6 sm:p-10 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-80"></div>

        {/* Back Link */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-brand-primary transition-colors focus:outline-none"
          >
            <Icons.ChevronRight className="w-4 h-4 rotate-180" />
            <span>Back to Sign In</span>
          </a>
        </div>

        {successId ? (
          <div className="text-center py-8 space-y-5">
            <div className="w-16 h-16 rounded-full bg-status-success-bg border border-status-success/30 flex items-center justify-center mx-auto text-status-success">
              <Icons.CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-text-primary">Application Submitted Successfully</h2>
              <p className="text-sm text-text-secondary max-w-md mx-auto">
                Your employee onboarding registration has been recorded in the database under reference ID:
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-card border border-brand-primary/30 font-mono text-sm text-brand-primary font-bold shadow-gold-glow">
                <span>{successId}</span>
              </div>
              <p className="text-xs text-text-tertiary max-w-md mx-auto">
                An administrator will review your application, assign your role & department, and activate your Employee ID.
              </p>
            </div>
            <div className="pt-4">
              <a
                href="/"
                className="inline-flex items-center justify-center py-2.5 px-6 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-text-inverse font-semibold text-sm shadow-gold-glow transition-all"
              >
                Return to Sign In
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Apply for Employee Access
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                Submit your official profile details for enterprise verification and RBAC role assignment.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6">
                <Alert type="error" title="Submission Error" message={errorMessage} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                  Personal & Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fullName" className="text-xs font-medium text-text-secondary uppercase">
                      Full Legal Name *
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Eleanor Vance"
                      className="w-full bg-surface-card/80 border border-border-default focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 rounded-lg px-3.5 py-2.5 text-sm text-text-primary outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-xs font-medium text-text-secondary uppercase">
                      Corporate / Official Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="eleanor.vance@pinnacle.com"
                      className="w-full bg-surface-card/80 border border-border-default focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 rounded-lg px-3.5 py-2.5 text-sm text-text-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="mobile" className="text-xs font-medium text-text-secondary uppercase">
                      Mobile Number (E.164) *
                    </label>
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="+14155552671"
                      className="w-full bg-surface-card/80 border border-border-default focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 rounded-lg px-3.5 py-2.5 text-sm text-text-primary outline-none font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="dateOfBirth" className="text-xs font-medium text-text-secondary uppercase">
                      Date of Birth
                    </label>
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full bg-surface-card/80 border border-border-default focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 rounded-lg px-3.5 py-2.5 text-sm text-text-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                  Residential Background
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="currentAddress" className="text-xs font-medium text-text-secondary uppercase">
                    Current Residential Address *
                  </label>
                  <textarea
                    id="currentAddress"
                    name="currentAddress"
                    rows={2}
                    required
                    value={formData.currentAddress}
                    onChange={handleChange}
                    placeholder="Street, City, State, Postal Code, Country"
                    className="w-full bg-surface-card/80 border border-border-default focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 rounded-lg px-3.5 py-2.5 text-sm text-text-primary outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="sameAddress"
                    type="checkbox"
                    checked={sameAsCurrent}
                    onChange={handleSameAddressToggle}
                    className="w-4 h-4 rounded bg-surface-card border-border-default text-brand-primary accent-brand-primary cursor-pointer"
                  />
                  <label htmlFor="sameAddress" className="text-xs text-text-secondary cursor-pointer select-none">
                    Permanent address is identical to current address
                  </label>
                </div>

                {!sameAsCurrent && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="permanentAddress" className="text-xs font-medium text-text-secondary uppercase">
                      Permanent Address *
                    </label>
                    <textarea
                      id="permanentAddress"
                      name="permanentAddress"
                      rows={2}
                      required
                      value={formData.permanentAddress}
                      onChange={handleChange}
                      placeholder="Permanent residence location"
                      className="w-full bg-surface-card/80 border border-border-default focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 rounded-lg px-3.5 py-2.5 text-sm text-text-primary outline-none resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Professional History */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                  Education & Experience
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="education" className="text-xs font-medium text-text-secondary uppercase">
                    Highest Educational Credential *
                  </label>
                  <input
                    id="education"
                    name="education"
                    type="text"
                    required
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="e.g. B.S. in Computer Science / Electrical Engineering"
                    className="w-full bg-surface-card/80 border border-border-default focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 rounded-lg px-3.5 py-2.5 text-sm text-text-primary outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="priorExperience" className="text-xs font-medium text-text-secondary uppercase">
                    Prior Operational Experience *
                  </label>
                  <textarea
                    id="priorExperience"
                    name="priorExperience"
                    rows={2}
                    required
                    value={formData.priorExperience}
                    onChange={handleChange}
                    placeholder="Summary of relevant past organizations, roles, or certifications"
                    className="w-full bg-surface-card/80 border border-border-default focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 rounded-lg px-3.5 py-2.5 text-sm text-text-primary outline-none resize-none"
                  />
                </div>
              </div>

              {/* Account Provisioning Notice */}
              <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 flex items-start gap-3">
                <span className="p-1 rounded bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                  <Icons.Shield className="w-4 h-4" />
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-text-primary tracking-wide">
                    Administrative Password Provisioning
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Your initial password will be assigned by the administrator after your application is approved. You will receive your Employee ID and initial credentials through the enterprise onboarding protocol.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-text-inverse font-semibold text-sm tracking-wide shadow-gold-glow hover:shadow-gold-glow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" className="text-text-inverse" label="Submitting Registration..." />
                  ) : (
                    <span>Submit Application for Approval</span>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
