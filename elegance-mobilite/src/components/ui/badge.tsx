"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border border-primary/60 bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border border-secondary/60 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border border-destructive/60 bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "border border-foreground/40 text-foreground",
        // Statuts de réservation avec des contours colorés et backgrounds plus subtils
        pending: "border border-yellow-400/40 bg-yellow-700/20 text-yellow-300 hover:bg-yellow-600/30 hover:border-yellow-400/60",
        accepted: "border border-green-400/40 bg-green-700/20 text-green-300 hover:bg-green-600/30 hover:border-green-400/60",
        completed: "border border-blue-400/40 bg-blue-700/20 text-blue-300 hover:bg-blue-600/30 hover:border-blue-400/60",
        inProgress: "border border-sky-400/40 bg-sky-700/20 text-sky-300 hover:bg-sky-600/30 hover:border-sky-400/60",
        delayed: "border border-orange-400/40 bg-orange-700/20 text-orange-300 hover:bg-orange-600/30 hover:border-orange-400/60",
        canceled: "border border-red-400/40 bg-red-900/20 text-red-400 hover:bg-red-900/40",
        noShow: "border border-purple-400/40 bg-purple-700/20 text-purple-300 hover:bg-purple-600/30 hover:border-purple-400/60",
        clientCanceled: "border border-red-400/40 bg-red-900/20 text-red-400 hover:bg-red-900/40",
        driverCanceled: "border border-red-400/40 bg-red-900/20 text-red-400 hover:bg-red-900/40",
        adminCanceled: "border border-red-400/40 bg-red-900/20 text-red-400 hover:bg-red-900/40",
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
