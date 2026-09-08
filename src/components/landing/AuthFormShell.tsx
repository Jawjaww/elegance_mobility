import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LandingDesktopPanel } from "@/components/landing/LandingDesktopPanel";
import { LANDING_KICKER } from "@/components/landing/landingSurface";

export function AuthFormShell({
  kicker,
  title,
  description,
  children,
  wide = false,
  className,
}: Readonly<{
  kicker?: string;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
  className?: string;
}>) {
  return (
    <div className={cn("w-full", wide ? "max-w-lg" : "max-w-md", className)}>
      {kicker ? <p className={`${LANDING_KICKER} mb-2`}>{kicker}</p> : null}
      <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-neutral-400 md:text-base">
          {description}
        </p>
      ) : null}
      <LandingDesktopPanel className="mt-6">{children}</LandingDesktopPanel>
    </div>
  );
}

export function AuthLoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}
