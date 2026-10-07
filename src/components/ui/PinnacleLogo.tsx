import React from 'react';

interface PinnacleLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const PinnacleLogo: React.FC<PinnacleLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const titleSizes = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-bold tracking-wider',
    lg: 'text-xl font-black tracking-widest',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Mountain Peak Geometric Hexagon / Triangle Emblem */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} rounded-lg bg-gradient-to-br from-surface-card to-surface-base border border-brand-primary/40 shadow-gold-glow flex-shrink-0`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4/5 h-4/5 text-brand-primary"
        >
          {/* Twin Pinnacle Peaks */}
          <path d="M3 20L12 4L16 11L21 20H3Z" fill="rgba(212, 175, 55, 0.15)" />
          <path d="M12 4L8.5 13L15.5 13" stroke="rgba(212, 175, 55, 0.8)" strokeWidth="1.2" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-sans tracking-wide text-text-primary ${titleSizes[size]}`}>
            PINNACLE
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/30 text-brand-primary font-mono font-medium uppercase tracking-wider">
            Ops
          </span>
        </div>
        {showSubtitle && (
          <span className="text-xs tracking-wider text-text-tertiary uppercase font-mono font-medium">
            POC.OPERATION
          </span>
        )}
      </div>
    </div>
  );
};
