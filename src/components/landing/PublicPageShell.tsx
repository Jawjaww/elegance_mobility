import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PublicHeader } from "@/components/landing/PublicHeader";
import {
  LANDING_PAGE_BG,
  LANDING_PAGE_GLOW,
  LANDING_PAGE_X,
} from "@/components/landing/landingSurface";

export function PublicPageShell({
  children,
  className,
  showHeader = true,
}: Readonly<{
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
}>) {
  return (
    <div className={cn("min-h-svh", LANDING_PAGE_BG, className)}>
      <div aria-hidden className={LANDING_PAGE_GLOW} />
      {showHeader ? <PublicHeader /> : null}
      <div className={cn("relative", LANDING_PAGE_X)}>{children}</div>
    </div>
  );
}
