import React from 'react';
import { LoginForm } from './LoginForm';
import { Icons } from '../ui/Icons';

interface LoginPageProps {
  initialReason?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialReason }) => {
  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      {/* Left Column: Enterprise Value Proposition & Highlights */}
      <div className="lg:col-span-7 flex flex-col justify-center space-y-6 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/30 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
          <span className="text-xs font-mono tracking-wider text-brand-primary font-medium uppercase">
            Operations Center Next-Gen
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text-primary leading-tight">
            Integrated Enterprise Operations & Workforce Control
          </h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-xl">
            A unified, zero-trust platform architected for asset surveillance, biometric identity verification, fleet deployment, and end-to-end operational visibility.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="glass-panel-subtle p-4 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2.5 text-brand-primary">
              <Icons.Shield className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-semibold text-xs tracking-wider uppercase text-text-primary">
                Granular RBAC Security
              </h3>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed">
              Scope-based permission inheritance with encrypted session isolation.
            </p>
          </div>

          <div className="glass-panel-subtle p-4 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2.5 text-brand-primary">
              <Icons.Cpu className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-semibold text-xs tracking-wider uppercase text-text-primary">
                Real-Time Telemetry
              </h3>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed">
              Edge-computed analytics and anomaly detection with millisecond dispatch.
            </p>
          </div>

          <div className="glass-panel-subtle p-4 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2.5 text-brand-primary">
              <Icons.FileCheck className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-semibold text-xs tracking-wider uppercase text-text-primary">
                Audit Trail Compliance
              </h3>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed">
              SOC2 Type II aligned non-repudiation audit logging on all state transitions.
            </p>
          </div>

          <div className="glass-panel-subtle p-4 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2.5 text-brand-primary">
              <Icons.Box className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-semibold text-xs tracking-wider uppercase text-text-primary">
                Unified Asset Management
              </h3>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed">
              End-to-end lifecycle tracking from acquisition to field decommissioning.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Translucent Glass Login Panel */}
      <div className="lg:col-span-5 w-full max-w-md mx-auto">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Subtle top accent gold edge */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-80"></div>
          
          <LoginForm initialReason={initialReason} />
        </div>
      </div>
    </div>
  );
};
