"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  iconClassName?: string;
  className?: string;
}

export function DashboardActionCard({
  title,
  description,
  icon,
  href,
  iconClassName = "bg-blue-500/10 border-blue-500/20 text-blue-400",
  className,
}: Readonly<DashboardActionCardProps>) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "relative p-5 sm:p-6 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 text-white transition-all duration-200 hover:border-neutral-700",
          className,
        )}
      >
        <div className="flex gap-4 items-start">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
              iconClassName,
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-neutral-100">{title}</h3>
            <p className="text-sm text-neutral-400 mt-0.5">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
