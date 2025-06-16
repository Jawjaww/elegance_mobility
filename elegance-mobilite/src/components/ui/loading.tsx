'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring';
  className?: string;
  text?: string;
  inline?: boolean;
}

const LoadingSpinner: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  className,
  text,
  inline = false
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div
            className={cn(
              'animate-spin rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500',
              sizeClasses[size],
              className
            )}
          />
        );

      case 'dots':
        return (
          <div className={cn('flex space-x-1', className)}>
            <div className={cn(
              'rounded-full bg-blue-500 animate-bounce',
              size === 'xs' ? 'w-1.5 h-1.5' :
              size === 'sm' ? 'w-2 h-2' :
              size === 'md' ? 'w-2.5 h-2.5' :
              size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
            )} style={{ animationDelay: '0ms' }} />
            <div className={cn(
              'rounded-full bg-blue-500 animate-bounce',
              size === 'xs' ? 'w-1.5 h-1.5' :
              size === 'sm' ? 'w-2 h-2' :
              size === 'md' ? 'w-2.5 h-2.5' :
              size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
            )} style={{ animationDelay: '150ms' }} />
            <div className={cn(
              'rounded-full bg-blue-500 animate-bounce',
              size === 'xs' ? 'w-1.5 h-1.5' :
              size === 'sm' ? 'w-2 h-2' :
              size === 'md' ? 'w-2.5 h-2.5' :
              size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
            )} style={{ animationDelay: '300ms' }} />
          </div>
        );

      case 'pulse':
        return (
          <div
            className={cn(
              'rounded-full bg-blue-500 animate-pulse',
              sizeClasses[size],
              className
            )}
          />
        );

      case 'bars':
        return (
          <div className={cn('flex space-x-1 items-end', className)}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'bg-blue-500 animate-pulse',
                  size === 'xs' ? 'w-0.5 h-2' :
                  size === 'sm' ? 'w-0.5 h-3' :
                  size === 'md' ? 'w-1 h-4' :
                  size === 'lg' ? 'w-1 h-6' : 'w-1.5 h-8'
                )}
                style={{
                  animationDelay: `${i * 150}ms`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );

      case 'ring':
        return (
          <div className={cn('relative', sizeClasses[size], className)}>
            <div className={cn(
              'absolute inset-0 rounded-full border-2 border-blue-500/20',
              sizeClasses[size]
            )} />
            <div className={cn(
              'absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin',
              sizeClasses[size]
            )} />
            <div className={cn(
              'absolute inset-1 rounded-full border border-transparent border-t-blue-400 animate-spin',
              'animation-duration-[1.5s] animation-direction-reverse'
            )} />
          </div>
        );

      default:
        return renderSpinner();
    }
  };

  if (inline) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        {renderSpinner()}
        {text && (
          <span className={cn('text-neutral-300', textSizeClasses[size])}>
            {text}
          </span>
        )}
      </span>
    );
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3',
      className
    )}>
      {renderSpinner()}
      {text && (
        <p className={cn(
          'text-neutral-300 font-medium animate-pulse',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

// Composant de loading pour page complète
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

// Composant de loading pour bouton
export const ButtonLoading: React.FC<{ size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ size = 'sm' }) => (
  <LoadingSpinner size={size} variant="spinner" inline className="text-white" />
);

// Composant de loading pour card/section
export const SectionLoading: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="lg" variant="dots" text={text} />
  </div>
);

// Composant de loading overlay
export const LoadingOverlay: React.FC<{ show: boolean; text?: string }> = ({ 
  show, 
  text = 'Chargement...' 
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
