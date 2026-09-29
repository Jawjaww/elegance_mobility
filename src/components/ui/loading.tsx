'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring';

interface LoadingProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  className?: string;
  text?: string;
  inline?: boolean;
}

type VariantProps = Pick<LoadingProps, 'size' | 'className'> & { size: LoadingSize };

const SIZE_CLASSES: Record<LoadingSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const TEXT_SIZE_CLASSES: Record<LoadingSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const DOT_SIZE_CLASSES: Record<LoadingSize, string> = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

const BAR_SIZE_CLASSES: Record<LoadingSize, string> = {
  xs: 'w-0.5 h-2',
  sm: 'w-0.5 h-3',
  md: 'w-1 h-4',
  lg: 'w-1 h-6',
  xl: 'w-1.5 h-8',
};

const DOT_DELAYS_MS = ['0ms', '150ms', '300ms'] as const;

function SpinnerIndicator({ size, className }: VariantProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500',
        SIZE_CLASSES[size],
        className,
      )}
    />
  );
}

function DotsIndicator({ size, className }: VariantProps) {
  return (
    <div className={cn('flex space-x-1', className)}>
      {DOT_DELAYS_MS.map((delay) => (
        <div
          key={delay}
          className={cn('rounded-full bg-blue-500 animate-bounce', DOT_SIZE_CLASSES[size])}
          style={{ animationDelay: delay }}
        />
      ))}
    </div>
  );
}

function PulseIndicator({ size, className }: VariantProps) {
  return (
    <div
      className={cn('rounded-full bg-blue-500 animate-pulse', SIZE_CLASSES[size], className)}
    />
  );
}

function BarsIndicator({ size, className }: VariantProps) {
  return (
    <div className={cn('flex space-x-1 items-end', className)}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn('bg-blue-500 animate-pulse', BAR_SIZE_CLASSES[size])}
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
}

function RingIndicator({ size, className }: VariantProps) {
  return (
    <div className={cn('relative', SIZE_CLASSES[size], className)}>
      <div
        className={cn(
          'absolute inset-0 rounded-full border-2 border-blue-500/20',
          SIZE_CLASSES[size],
        )}
      />
      <div
        className={cn(
          'absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin',
          SIZE_CLASSES[size],
        )}
      />
      <div
        className={cn(
          'absolute inset-1 rounded-full border border-transparent border-t-blue-400 animate-spin',
          'animation-duration-[1.5s] animation-direction-reverse',
        )}
      />
    </div>
  );
}

const VARIANT_INDICATORS: Record<LoadingVariant, React.FC<VariantProps>> = {
  spinner: SpinnerIndicator,
  dots: DotsIndicator,
  pulse: PulseIndicator,
  bars: BarsIndicator,
  ring: RingIndicator,
};

const LoadingSpinner: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  className,
  text,
  inline = false,
}) => {
  const Indicator = VARIANT_INDICATORS[variant] ?? SpinnerIndicator;
  const indicator = <Indicator size={size} className={className} />;

  if (inline) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        {indicator}
        {text ? (
          <span className={cn('text-neutral-300', TEXT_SIZE_CLASSES[size])}>{text}</span>
        ) : null}
      </span>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      {indicator}
      {text ? (
        <p className={cn('text-neutral-300 font-medium animate-pulse', TEXT_SIZE_CLASSES[size])}>
          {text}
        </p>
      ) : null}
    </div>
  );
};

export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Chargement...' }) => (
  <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
    <div className="text-center space-y-6">
      <LoadingSpinner size="xl" variant="ring" />
      <div className="space-y-2">
        <p className="text-xl font-semibold text-neutral-200">{text}</p>
        <p className="text-sm text-neutral-400">Veuillez patienter quelques instants</p>
      </div>
    </div>
  </div>
);

export const ButtonLoading: React.FC<{ size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ size = 'sm' }) => (
  <LoadingSpinner size={size} variant="spinner" inline className="text-white" />
);

export const SectionLoading: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="lg" variant="dots" text={text} />
  </div>
);

export const LoadingOverlay: React.FC<{ show: boolean; text?: string }> = ({
  show,
  text = 'Chargement...',
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg p-8 border border-neutral-700 shadow-2xl">
        <LoadingSpinner size="lg" variant="ring" text={text} />
      </div>
    </div>
  );
};

export default LoadingSpinner;
