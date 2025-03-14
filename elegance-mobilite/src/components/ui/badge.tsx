"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Statuts de réservation avec des couleurs distinctives
        pending: "border-transparent bg-yellow-700/50 text-yellow-200 hover:bg-yellow-600/50",
        accepted: "border-transparent bg-green-700/50 text-green-200 hover:bg-green-600/50",
        completed: "border-transparent bg-blue-700/50 text-blue-200 hover:bg-blue-600/50",
        inProgress: "border-transparent bg-purple-700/50 text-purple-200 hover:bg-purple-600/50",
        // Une seule variante pour tous les types d'annulation
        canceled: "border-transparent bg-red-700/50 text-red-200 hover:bg-red-600/50",
        // Garder ces variantes pour l'administrateur seulement
        clientCanceled: "border-transparent bg-red-700/50 text-red-200 hover:bg-red-600/50",
        driverCanceled: "border-transparent bg-red-800/50 text-red-200 hover:bg-red-700/50",
        adminCanceled: "border-transparent bg-red-900/50 text-red-200 hover:bg-red-800/50",
      },
      size: {
        default: "rounded-md px-2.5 py-0.5 text-xs",
        sm: "rounded px-1.5 py-0.25 text-xs",
        lg: "rounded-md px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
