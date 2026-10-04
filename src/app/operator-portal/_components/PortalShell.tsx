"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Cadre commun des écrans du portail opérateur : un titre, une phrase de portée, puis le corps.
 *
 * Trois états reviennent sur chaque écran — en chargement, en erreur (avec reprise), vide. Les
 * factoriser évite qu'un écran oublie l'un des trois et affiche une table muette.
 */

export function PortalSection({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle?: string; children: ReactNode }>) {
  return (
    <div className="space-y-5 lg:space-y-6">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-neutral-400">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function PortalMessage({
  title,
  detail,
  onRetry,
}: Readonly<{ title: string; detail?: string | null; onRetry?: () => void }>) {
  return (
    <Card className="w-full p-6 text-center sm:p-8">
      <p className="text-sm text-neutral-300 sm:text-base">{title}</p>
      {detail ? (
        <p className="mt-2 break-words text-xs text-neutral-500 sm:text-sm">{detail}</p>
      ) : null}
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="mt-4 min-h-11 w-full px-8 sm:w-auto"
        >
          Réessayer
        </Button>
      ) : null}
    </Card>
  );
}

export function PortalSkeleton({ rows = 3 }: Readonly<{ rows?: number }>) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, index) => (
        <Card
          key={index}
          className="h-14 animate-pulse border-neutral-800 bg-neutral-900/50"
        />
      ))}
    </div>
  );
}
