import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LANDING_DESKTOP_PANEL } from "@/components/landing/landingSurface";

export function LandingDesktopPanel({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn(LANDING_DESKTOP_PANEL, className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden opacity-50 md:block"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 22% 12%, rgba(37,99,235,0.08), transparent 58%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
