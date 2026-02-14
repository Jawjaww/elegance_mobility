"use client";

import React from 'react'

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode
}

// Thin wrapper that scopes the "card-elegant" glass surface to places that
// explicitly opt-in. This prevents changing Card globally while letting new
// onboarding surfaces reuse the glass styling.
export default function GlassCard({ children, className = '', ...props }: GlassCardProps) {
  return (
    <div className={`card-elegant ${className}`} {...props}>
      {children}
    </div>
  )
}
